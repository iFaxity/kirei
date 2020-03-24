import udomdiff from 'udomdiff';
import { toRawValue } from '@shlim/fx';
import { diffable } from './shared';
import { parseDirective, DirectiveUpdater } from './directive';

// this helper avoid code bloat around handleAnything() callback
function diff(node, oldNodes, newNodes) {
  // TODO: there is a possible edge case where a node has been
  //       removed manually, or it was a keyed one, attached
  //       to a shared reference between renders.
  //       In this case udomdiff might fail at removing such node
  //       as its parent won't be the expected one.
  //       The best way to avoid this issue is to filter oldNodes
  //       in search of those not live, or not in the current parent
  //       anymore, but this would require both a change to uwire,
  //       exposing a parentNode from the firstChild, as example,
  //       but also a filter per each diff that should exclude nodes
  //       that are not in there, penalizing performance quite a lot.
  //       As this has been also a potential issue with domdiff,
  //       and both lighterhtml and hyperHTML might fail with this
  //       very specific edge case, I might as well document this possible
  //       "diffing shenanigan" and call it a day.
  return udomdiff(node.parentNode, oldNodes, newNodes, diffable, node);
}

export function attrParser(node: Element, name: string): DirectiveUpdater {
  // Check for directive
  const res = parseDirective(node, name);
  if (res) return res;

  // Default attribute parser
  const mapValue = name == 'class' || name == 'style';
  let value;

  return (pending: any) => {
    let newValue = toRawValue(pending) as any;

    if (value !== newValue) {
      if (newValue == null) {
        node.removeAttribute(name);
      } else {
        if (mapValue && typeof newValue == 'object') {
          let classes: string[];
          if (Array.isArray(newValue)) {
            classes = newValue.filter(x => x);
          } else {
            classes = Object.keys(newValue).filter(key => !!newValue[key]);
          }

          newValue = classes.join(' ')
        }

        node.setAttribute(name, newValue);
      }

      value = newValue;
    }
  };
}

export function nodeParser(refNode: Comment): DirectiveUpdater {
  let nodes = [];
  let value;
  let text;

  // Clear the contents of the reference node
  refNode.textContent = '';
  const parse = newValue => {
    switch (typeof newValue) {
      // primitives are handled as text content
      case 'string':
      case 'number':
      case 'boolean':
        if (value !== newValue) {
          value = newValue;
          if (!text)
            text = document.createTextNode('');
          text.textContent = newValue;
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
        }
        // arrays and nodes have a special treatment
        else if (Array.isArray(newValue)) {
          value = newValue;
          // arrays can be used to cleanup, if empty
          if (value.length === 0)
            nodes = diff(refNode, nodes, []);
          // or diffed, if these contains nodes or "wires"
          else if (typeof value[0] === 'object')
            nodes = diff(refNode, nodes, value);
          // in all other cases the content is stringified as is
          else
            parse('' + value);
        }
        // if the new value is a DOM node, or a wire, and it's
        // different from the one already live, then it's diffed.
        // if the node is a fragment, it's appended once via its childNodes
        // There is no `else` here, meaning if the content
        // is not expected one, nothing happens, as easy as that.
        else if ('ELEMENT_NODE' in newValue && newValue !== value) {
          const newNodes = newValue.nodeType === Node.DOCUMENT_FRAGMENT_NODE
            ? [...newValue.childNodes]
            : [newValue];

          value = newValue;
          nodes = diff(refNode, nodes, newNodes);
        }
      }
  };

  return parse;
}

export function textParser(node: Text): DirectiveUpdater {
  let value;

  return (newValue: string) => {
    if (value !== newValue) {
      value = newValue;
      node.textContent = newValue == null ? '' : newValue;
    }
  };
}
