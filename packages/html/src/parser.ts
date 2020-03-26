import { isRef } from '@shlim/fx';
import { diff } from './shared';
import { parseDirective, DirectiveUpdater } from './directive';
import { warn } from '@shlim/shared/src';

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

export function attrParser(node: Element, name: string): DirectiveUpdater {
  // Check for attribute directive
  const res = parseDirective(node, name);
  if (res) return res;

  // Default to attribute parsing
  const shouldMap = name == 'class' || name == 'style';
  let value;
  let mounted = false;

  return (pending: any) => {
    const newValue = isRef(pending) ? pending.value : pending;
    if (value === newValue && !shouldMap) return;
    value = newValue;

    if (value == null || value == '') {
      if (mounted) {
        node.removeAttribute(name);
        mounted = false;
      }
    } else if (!mounted) {
      node.setAttribute(name, shouldMap ? mapAttribute(value) : value);
      mounted = true;
    }
  };
}

export function nodeParser(refNode: Comment): DirectiveUpdater {
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

    nodes = diff(refNode, nodes, [text]);
  }

  return (pending: any) => {
    const newValue = isRef(pending) ? pending.value : pending;
    const type = typeof newValue;

    if (type != 'object' && type != 'undefined') {
      // primitives are handled as text content
      nodeTextParser(newValue);
    } else if (newValue == null) {
      // null, and undefined are used to cleanup previous content
      if (value) {
        value = newValue;
        nodes = diff(refNode, nodes, []);
      }
    } else if (Array.isArray(newValue)) {
      // arrays and nodes have a special treatment
      value = newValue;

      if (value.length === 0 || typeof value[0] === 'object') {
        // arrays can be used to cleanup, if empty
        // or diffed, if these contains nodes or "wires"
        nodes = diff(refNode, nodes, value);
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
      nodes = diff(refNode, nodes, value);
    } else {
      warn('Invalid node expression in html template');
    }
  };
}

export function textParser(node: Text): DirectiveUpdater {
  let value;

  return (pending: any) => {
    const newValue = isRef(pending) ? pending.value : pending;

    if (value !== newValue) {
      value = newValue;
      node.textContent = value == null ? '' : value;
    }
  };
}
