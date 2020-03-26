import { toRawValue } from '@shlim/fx';
import { diff } from './shared';
import { parseDirective, DirectiveUpdater } from './directive';

export function attrParser(node: Element, name: string): DirectiveUpdater {
  // Check for directive
  const res = parseDirective(node, name);
  if (res) return res;

  // Default attribute parser
  const mapValue = name == 'class' || name == 'style';
  let value;

  return (pending: any) => {
    let newValue = toRawValue(pending) as any;
    if (value === newValue) return;
    value = newValue

    if (value == null) {
      node.removeAttribute(name);
    } else {
      if (mapValue && typeof value == 'object') {
        if (Array.isArray(value)) {
          value = value.filter(x => x).join(' ');
        } else {
          value = Object.keys(value).filter(key => !!value[key]).join(' ');
        }
      }

      node.setAttribute(name, value);
    }
  };
}

export function nodeParser(refNode: Comment): DirectiveUpdater {
  let nodes = [];
  let value;
  let text;

  // Clear the contents of the reference node
  refNode.textContent = '';
  const parse = (pending: any) => {
    const newValue = toRawValue(pending) as any;
    switch (typeof newValue) {
      // primitives are handled as text content
      case 'string':
      case 'number':
      case 'boolean':
        if (value !== newValue) {
          value = newValue;
          if (!text) {
            text = document.createTextNode('');
          }

          text.textContent = value;
          nodes = diff(refNode, nodes, [text]);
        }
        break;
      // null, and undefined are used to cleanup previous content
      case 'object':
      case 'undefined':
        if (newValue == null) {
          if (value) {
            value = newValue;
            nodes = diff(refNode, nodes, []);
          }
        } else if (Array.isArray(newValue)) {
          // arrays and nodes have a special treatment
          value = newValue;
          if (value.length === 0) {
            // arrays can be used to cleanup, if empty
            nodes = diff(refNode, nodes, []);
          } else if (typeof value[0] === 'object') {
            // or diffed, if these contains nodes or "wires"
            nodes = diff(refNode, nodes, value);
          } else {
            // in all other cases the content is stringified as is
            parse('' + value);
          }
        } else if ('ELEMENT_NODE' in newValue && newValue !== value) {
          // if the new value is a DOM node, or a wire, and it's
          // different from the one already live, then it's diffed.
          // if the node is a fragment, it's appended once via its childNodes
          // There is no `else` here, meaning if the content
          // is not expected one, nothing happens, as easy as that.
          if (newValue.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            value = Array.from((newValue as DocumentFragment).childNodes);
          } else {
            value = [newValue];
          }
          nodes = diff(refNode, nodes, value);
        }
      }
  };

  return parse;
}

export function textParser(node: Text): DirectiveUpdater {
  let value;

  return (pending: any) => {
    const newValue = toRawValue(pending) as any;
    if (value !== newValue) {
      value = newValue;
      node.textContent = value == null ? '' : value;
    }
  };
}
