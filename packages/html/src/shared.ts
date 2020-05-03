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

function remove(node: Node) {
  const { firstChild } = node;
  const parent = firstChild.parentNode;
  while (parent.firstChild != parent.lastChild) {
    parent.lastChild.remove();
  }
  return firstChild;
}

export function clearNode(node: Node|Element) {
  // Check if node is already empty
  if (!node.lastChild) return;
  node.textContent = '';
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

export function persistent(frag: DocumentFragment): Node {
  const children = frag.childNodes;
  // no content, return undefined (or first child)
  if (children.length < 2) return children[0];

  const nodes = Array.from(children);
  const firstChild = nodes[0];
  const valueOf = () => {
    if (children.length !== nodes.length) {
      for (let i = 0; i < length; i++) {
        frag.appendChild(nodes[i]);
      }
    }
    return frag;
  };
  // @ts-ignore
  return { nodeType, firstChild, valueOf };
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

export function createTemplate(type: string, markup: string): HTMLTemplateElement {
  const template = document.createElement('template');

  if (type == 'svg') {
    // Wrap in a svg element and then move the child nodes back to the template element
    template.innerHTML = `<svg>${markup}</svg>`;
    const { content } = template;
    const svg = content.firstChild;
    content.removeChild(svg);

    while (svg.firstChild) {
      content.appendChild(svg.firstChild);
    }
  } else {
    template.innerHTML = markup;
  }
  return template;
}

