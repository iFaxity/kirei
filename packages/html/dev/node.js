import createContent from '@ungap/create-content';

// this "hack" tells the library if the browser is IE11 or old Edge
const IE = document.importNode.length != 1;


// from a generic path, retrieves the exact targeted node
export const reducePath = (node, i) => node.childNodes[i];

// from a fragment container, create an array of indexes
// related to its child nodes, so that it's possible
// to retrieve later on exact node via reducePath
export const createPath = node => {
  const path = [];
  let {parentNode} = node;
  while (parentNode) {
    const idx = Array.prototype.indexOf.call(parentNode.childNodes, node);
    path.unshift(idx);

    node = parentNode;
    parentNode = node.parentNode;
  }
  return path;
};

// IE11 and old Edge discard empty nodes when cloning, potentially
// resulting in broken paths to find updates. The workaround here
// is to import once, upfront, the fragment that will be cloned
// later on, so that paths are retrieved from one already parsed,
// hence without missing child nodes once re-cloned.
export const createFragment = IE
  ? (text, type) => document.importNode(createContent(text, type), true) 
  : createContent;

// IE11 and old Edge have a different createTreeWalker signature that
// has been deprecated in other browsers. This export is needed only
// to guarantee the TreeWalker doesn't show warnings and, ultimately, works
export const createWalker = IE ?
  fragment => document.createTreeWalker(fragment, 1 | 128, null, false) :
  fragment => document.createTreeWalker(fragment, 1 | 128);
