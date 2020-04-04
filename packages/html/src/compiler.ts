import { diff } from './shared';
import { warn } from '@shlim/shared';

export type TemplatePatcher = (newValue: any) => void;

export interface TemplateCompiler {
  attr?(node: HTMLElement, attr: string): TemplatePatcher|void;
  node?(ref: Comment): TemplatePatcher|void;
  text?(node: Text): TemplatePatcher|void;
}

/**
 * Maps a style or class attribute from an array or an object to a string
 * @param {object|array} className
 * @returns {string}
 */
function mapAttribute(className: any[]|object): any {
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
function eventPatcher(node: Node, name: string): TemplatePatcher {
  let value;
  return (newValue) => {
    if (value !== newValue) {
      value && node.removeEventListener(name, value, false);
      newValue && node.addEventListener(name, newValue, false);
      value = newValue;
    }
  };
}
function nodeTextParser(text: Text, ref: Node, nodes: Node[], value: any): [Text, Node[]] {
  if (!text) {
    text = document.createTextNode(value);
  } else {
    text.textContent = value;
  }

  nodes = diff(ref, nodes, [text]);
  return [ text, nodes ];
}

export const defaultCompiler: TemplateCompiler = {
  attr(node, name) {
    const prefix = name[0];
    if (prefix == '.') {
      return propPatcher(node, name.slice(1));
    } else if (prefix == '@') {
      return eventPatcher(node, name.slice(1));
    }

    // Default to attribute parsing
    const shouldMap = name == 'class' || name == 'style';
    const attr = document.createAttribute(name);
    let value;
    let mounted = false;

    return (newValue: any) => {
      if (value === newValue && !shouldMap) return;
      value = newValue;

      if (value == null || value == '') {
        if (mounted) {
          node.removeAttributeNode(attr);
          mounted = false;
        }
      } else {
        attr.value = shouldMap ? mapAttribute(value) : value;
        if (!mounted) {
          node.setAttributeNode(attr);
          mounted = true;
        }
      }
    };
  },
  node(ref) {
    let nodes: Node[] = [];
    let value;
    let text: Text;

    return (newValue: any) => {
      const type = typeof newValue;

      // primitives are handled as text content
      if (type != 'object' && type != 'undefined') {
        if (value !== newValue) {
          value = newValue;
          [text, nodes] = nodeTextParser(text, ref, nodes, value);
        }
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
          if (value !== newValue) {
            value = newValue;
            [text, nodes] = nodeTextParser(text, ref, nodes, value);
          }
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
