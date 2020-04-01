import { diff } from './shared';
import { warn } from '@shlim/shared';

export type TemplatePatcher = (newValue: any) => void;

export type TemplateCompiler = {
  attr?(node: HTMLElement, attr: string): TemplatePatcher|void;
  node?(ref: Comment): TemplatePatcher|void;
  text?(node: Text): TemplatePatcher|void;
}

/**
 * Maps a style or class attribute from an array or an object to a string
 * @param {object|array} className
 * @returns {string}
 */
function mapAttribute(className: any[]|object) {
  if (className == null || typeof className != 'object') return className;

  if (Array.isArray(className)) {
    return className.filter(x => x).join(' ');
  }
  return Object.keys(className).filter(key => !!className[key]).join(' ');
}

// Special patchers for prop and event
function propPatcher(node: Node, name: string): TemplatePatcher {
  return (newValue) => { node[name] = newValue };
}
function eventPatcher(node: Node, name: string) {
  let value;

  return (newValue) => {
    if (value !== newValue) {
      if (value) {
        node.removeEventListener(name, value, false);
      }
      if (newValue) {
        node.addEventListener(name, newValue, false);
      }
      value = newValue;
    }
  };
}

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

    return (newValue: any) => {
      if (value === newValue && !shouldMap) return;
      value = newValue;

      if (value == null || value == '') {
        node.setAttribute(attr, value);
      } else {
        node.setAttribute(attr, shouldMap ? mapAttribute(value) : value);
      }
    };
  },
  node(ref) {
    let nodes: Node[] = [];
    let value;
    let text: Text;

    function nodeTextParser(newValue: any) {
      if (value === newValue) return;
      value = newValue;

      if (!text) {
        text = document.createTextNode(value);
      } else {
        text.textContent = value;
      }

      nodes = diff(ref, nodes, [text]);
    }

    return (newValue: any) => {
      const type = typeof newValue;

      if (type != 'object' && type != 'undefined') {
        // primitives are handled as text content
        nodeTextParser(newValue);
      } else if (newValue == null) {
        // null, and undefined are used to cleanup previous content
        if (value) {
          value = newValue;
          nodes = diff(ref, nodes, []);
        }
      } else if (Array.isArray(newValue)) {
        // arrays and nodes have a special treatment
        value = newValue;

        if (value.length === 0 || typeof value[0] === 'object') {
          // arrays can be used to cleanup, if empty
          // or diffed, if these contains nodes or "wires"
          nodes = diff(ref, nodes, value);
        } else {
          // in all other cases the content is stringified as is
          nodeTextParser(newValue.toString());
        }
      } else if ('ELEMENT_NODE' in newValue && newValue !== value) {
        // if the new value is a DOM node, or a wire, and it's
        // different from the one already live, then it's diffed.
        // if the node is a fragment, it's appended once via its childNodes
        // There is no `else` here, meaning if the content
        // is not expected one, nothing happens, as easy as that.
        value = newValue.nodeType === Node.DOCUMENT_FRAGMENT_NODE
          ? Array.from((newValue as DocumentFragment).childNodes)
          : [newValue];
        nodes = diff(ref, nodes, value);
      } else {
        warn('Invalid node expression in html template');
      }
    };
  },
  text(node) {
    let value;

    return (newValue: any) => {
      if (value !== newValue) {
        value = newValue;
        node.textContent = value == null ? '' : value;
      }
    };
  }
};
