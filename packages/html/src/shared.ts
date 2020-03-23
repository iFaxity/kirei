// Shamelessly copied from the package uwire
const ELEMENT_NODE = 1;
const nodeType = 111;

function remove({firstChild, lastChild}) {
  const range = document.createRange();
  range.setStartAfter(firstChild);
  range.setEndAfter(lastChild);
  range.deleteContents();
  return firstChild;
}

export function diffable(node, operation) {
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
  if (length < 2)
    return childNodes[0];
  const nodes = Array.from(childNodes);
  const firstChild = nodes[0];
  const lastChild = nodes[length - 1];
  return {
    ELEMENT_NODE,
    nodeType,
    firstChild,
    lastChild,
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
