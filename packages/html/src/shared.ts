import domdiff from 'udomdiff';

// this "hack" tells the library if the browser is IE11 or old Edge
const IE = document.importNode.length != 1;

// IE11 and old Edge have a different createTreeWalker signature that
// has been deprecated in other browsers. This export is needed only
// to guarantee the TreeWalker doesn't show warnings and, ultimately, works
const filter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT;
export const createWalker = IE
  ? node => document.createTreeWalker(node, filter, null, false)
  : node => document.createTreeWalker(node, filter);

// Shamelessly copied from the package uwire
const nodeType = 123;

function remove({firstChild, lastChild}) {
  const range = document.createRange();
  range.setStartAfter(firstChild);
  range.setEndAfter(lastChild);
  range.deleteContents();
  return firstChild;
}

export function clearNode(node: Node|Element) {
  // innerHTMl is faster, but doesn't work for DocumentFragments
  if ('innerHTML' in node) {
    node.innerHTML = '';
  } else {
    while (node.lastChild) {
      node.removeChild(node.lastChild);
    }
  }
}

function diffable(node, operation) {
  if (node.nodeType === nodeType) {
    if (1 / operation < 0) {
      return operation ? remove(node) : node.lastChild;
    }

    return operation ? node.valueOf() : node.firstChild;
  }

  return node;
}

export function persistent(fragment: DocumentFragment): Node {
  const {childNodes} = fragment;
  const {length} = childNodes;
  // If the fragment has no content
  // it should return undefined and break
  if (length < 2) return childNodes[0];

  const nodes = Array.from(childNodes);
  return {
    nodeType,
    ELEMENT_NODE: 1,
    firstChild: nodes[0],
    lastChild: nodes[length - 1],
    //@ts-ignore
    valueOf() {
      if (childNodes.length !== length) {
        let i = 0;
        while (i < length)
          fragment.appendChild(nodes[i++]);
      }
      return fragment;
    }
  };
};

// this helper avoid code bloat
export function diff(node, oldNodes, newNodes) {
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
  return domdiff(node.parentNode, oldNodes, newNodes, diffable, node);
}
