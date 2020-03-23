import udomdiff from 'udomdiff';
import { toRawValue } from '@shlim/fx';
import { diffable } from './shared';
import { refDirective, parseDirective, DirectiveUpdater } from './directive';
// import directives
import './directives/bind';
import './directives/conditional';
import './directives/on';
import './directives/show';
import './directives/sync';

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

function defaultAttrParser(node: Element, name: string): DirectiveUpdater {
  const attr = document.createAttribute(name);
  let mounted = false;
  let value;
  const mapValue = name == 'class' || name == 'style';

  return (pending: any) => {
    let newValue = toRawValue(pending) as any;

    if (value !== newValue) {
      if (newValue == null) {
        if (!mounted) {
          node.removeAttributeNode(attr);
          mounted = false;
        }
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

        attr.value = newValue as string;
        if (mounted) {
          node.setAttributeNode(attr);
          mounted = true;
        }
      }

      value = newValue;
    }
  };
}

export function attrParser(node: Element, name: string): DirectiveUpdater {
  if (name == 'ref') {
    return parseDirective('ref', node, refDirective);
  } else if (name[0] == '.') {
    return parseDirective(`bind:${name.slice(1)}`, node);
  } else if (name[0] == '@') {
    return parseDirective(`on:${name.slice(1)}`, node);
  } else if (name[0] == '&') {
    const args = name.length > 1 ? `:${name.slice(1)}` : '';
    return parseDirective(`sync${args}`, node);
  } else if (name.startsWith('v-')) {
    return parseDirective(name.slice(2), node);
  }

  return defaultAttrParser(node, name);
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

// Default directives
//ref
//v-bind, .
//v-on, @
//v-if
//v-not
//v-sync, &
