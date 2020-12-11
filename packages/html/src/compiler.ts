import { diff } from './shared';
import { isObject } from '@kirei/shared';

/**
 * Template patcher function to update a dynamic value in the DOM
 */
export type TemplatePatcher = (pending: unknown) => void;

/**
 * Type of patcher to use for compiling a TemplatePatcher
 */
export enum PatchType {
  NODE = 'node',
  ATTR = 'attr',
  TEXT = 'text',
}

/**
 * Used to configure how the template values are translated into the DOM,
 * each method should return a function which takes one parameter as the interpolated value.
 * Otherwise it fallbacks to the default compiler.
 */
export interface TemplateCompiler<T = TemplatePatcher|void> {
  /**
   * Compiles a TemplatePatcher for an attribute value, does not have the attribute mounted
   * @param node - Element which the attribute was applied to
   * @param attr - Attribute name
   * @returns A patcher function to update the value
   */
  attr?(node: Element, attr: string): T;

  /**
   * Compiles a TemplatePatcher for a node value
   * @param ref - Reference Comment node where to apply update after
   * @returns A patcher function to update the value
   */
  node?(ref: Comment): T;

  /**
   * Compiles a TemplatePatcher for a text node
   * @param node - Text node to set text value to
   * @returns A patcher function to update the value
   */
  text?(node: Text): T;
}

/**
 * Maps a style or class attribute from an array or an object to a string
 * @param attr - Attribute name
 * @param value - Value to map to a primitive value
 * @returns THe mapped value as a primitive value
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
 * Special patcher for updating an element property
 * @param node - Element node to set prop value to
 * @param name - Property name to set
 * @returns A patcher function to update the value
 * @private
 */
function propPatcher(node: Element, name: string): TemplatePatcher {
  return (pending) => { node[name] = pending };
}

/**
 * Special patcher for event bindings
 * @param node - Element node to set prop value to
 * @param name - Property name to set
 * @returns A patcher function to update the value
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
 */
export const defaultCompiler: TemplateCompiler<TemplatePatcher> = {
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
        throw new TypeError('Invalid node expression in html template');
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
