import { diff } from './shared';
import { isObject } from '@kirei/shared';

/**
 * Template patcher function to update a dynamic value in the DOM
 * @type
 */
export type TemplatePatcher = (pending: unknown) => void;

/**
 * Used to configure how the template values are translated into the DOM,
 * each method should return a function which takes one parameter as the interpolated value.
 * Otherwise it fallbacks to the default compiler.
 * @interface
 */
export interface TemplateCompiler {
  /**
   * Compiles a TemplatePatcher for an attribute value, does not have the attribute mounted
   * @param {Element} node Element which the attribute was applied to
   * @param {string} attr Attribute name
   * @returns {TemplatePatcher|void}
   */
  attr?(node: Element, attr: string): TemplatePatcher|void;

  /**
   * Compiles a TemplatePatcher for a node value
   * @param {Comment} ref Reference where to apply update after
   * @returns {TemplatePatcher|void}
   */
  node?(ref: Comment): TemplatePatcher|void;

  /**
   * Compiles a TemplatePatcher for a text node
   * @param {Text} node Text node to set text value to
   * @returns {TemplatePatcher|void}
   */
  text?(node: Text): TemplatePatcher|void;
}

/**
 * Maps a style or class attribute from an array or an object to a string
 * @param {string} attr
 * @param {object} value
 * @returns {string}
 */
function mapAttribute<T extends object>(attr: string, value: T): string|T {
  if (!isObject(value)) {
    return value;
  } else if (Array.isArray(value)) {
    if (attr == 'style') {
      throw new TypeError('Style attribute expressions cannot map array');
    }

    return value.filter(x => x).join(' ');
  }

  const keys = Object.keys(value).filter(key => value[key]);
  if (attr == 'style') {
    return keys.map(key => `${key}=${value[key]}`).join(';');
  }
  return keys.join(' ');
}

/**
 * Special patchers for prop and event
 * @param {Element} node
 * @param {string} name
 * @returns {TemplatePatcher}
 * @private
 */
function propPatcher(node: Element, name: string): TemplatePatcher {
  return (pending) => { node[name] = pending };
}

/**
 * @param {Element} node
 * @param {string} name
 * @returns {TemplatePatcher}
 * @private
 */
function eventPatcher(node: Element, name: string): TemplatePatcher {
  // Using a bound listener prevents frequent remounting
  let listener;
  function boundListener(e: Event): void {
    return listener.call(node, e);
  }

  return (pending) => {
    if (listener !== pending) {
      if (pending == null) {
        node.removeEventListener(name, boundListener, false);
      } else if (listener == null) {
        node.addEventListener(name, boundListener, false);
      }
      listener = pending;
    }
  };
}

/**
 * Default template compiler
 * @const {TemplateCompiler}
 */
export const defaultCompiler: TemplateCompiler = {
  attr(node, attr) {
    const prefix = attr[0];
    if (prefix == '.') {
      return propPatcher(node, attr.slice(1));
    } else if (prefix == '@') {
      return eventPatcher(node, attr.slice(1));
    }

    // Default to attribute parsing
    const shouldMap = attr == 'class' || attr == 'style';
    let value;
    return (pending) => {
      if (value === pending) return;
      value = pending;

      if (value == null) {
        node.removeAttribute(attr);
      } else {
        node.setAttribute(attr, shouldMap ? mapAttribute(attr, value) : value);
      }
    };
  },
  node(ref) {
    let nodes: Node[] = [];
    let value;
    let text: Text;
    const nodeParser: TemplatePatcher = (pending) => {
      // TODO: allow object as text, as refs have toString
      if (pending == null) {
        // null, and undefined are used to cleanup previous content
        if (value) {
          value = pending;
          nodes = diff(ref, nodes, []);
        }
      } else if (!isObject(pending)) {
        // primitives are handled as text content
        if (value !== pending) {
          value = pending;
          if (!text) {
            text = document.createTextNode(value);
          } else {
            text.textContent = value;
          }
          nodes = diff(ref, nodes, [text]);
        }
      } else if ('nodeType' in pending && pending !== value) {
        // if the new value is a DOM node, or a wire, and it's
        // different from the one already live, then it's diffed.
        // if the node is a fragment, it's appended once via its childNodes
        // There is no `else` here, meaning if the content
        // is not expected one, nothing happens, as easy as that.
        value = pending instanceof DocumentFragment ? Array.from(pending.childNodes) : [pending];
        nodes = diff(ref, nodes, value);
      } else if (Array.isArray(pending)) {
        // arrays and nodes have a special treatment
        value = pending;

        if (value.length === 0 || isObject(value[0])) {
          // arrays can be used to cleanup, if empty
          // or diffed, if these contains nodes or "wires"
          nodes = diff(ref, nodes, value);
        } else if (value !== pending) {
          // in all other cases the content is stringified as is
          nodeParser(String(pending));
        }
      } else {
        throw new Error('Invalid node expression in html template');
      }
    };

    return nodeParser;
  },
  text(node) {
    let value;
    return (pending) => {
      if (value !== pending) {
        value = pending;
        node.textContent = value == null ? '' : value;
      }
    };
  },
};
