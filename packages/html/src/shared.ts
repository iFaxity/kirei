import domdiff from 'udomdiff';

/**
 * This "hack" tells the library if the browser is IE11 or old Edge
 */
const IE = document.importNode.length != 1;

/**
 * Node filter for createWalker
 */
const filter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT;

/**
 * Node type of a persistent document fragment
 */
const PERSIST_NODE_TYPE = 123;

/**
 * IE11 and old Edge have a different createTreeWalker signature that
 * has been deprecated in other browsers. This export is needed only
 * to guarantee the TreeWalker doesn't show warnings and, ultimately, works
 * @private
 */
export const createWalker = IE
  ? node => document.createTreeWalker(node, filter, null, false)
  : node => document.createTreeWalker(node, filter);

/**
 * Removes every direct descendent node except the first one
 * @param node - Node to remove descendents from
 * @returns The first direct descendent of the node
 * @private
 */
function remove(node: Node): Node {
  const { firstChild } = node;
  const parent = firstChild.parentNode;
  while (parent.firstChild != parent.lastChild) {
    parent.lastChild.remove();
  }
  return firstChild;
}

/**
 * Clears all the content of the node
 * @param node - Clears every direct descendent node
 * @private
 */
export function clearNode(node: Node): void {
  // Check if node is already empty
  if (!node.lastChild) return;
  node.textContent = '';
}

/**
 * Differ function for domdiff to handle persistent fragments
 * @param node - Node to diff
 * @param operation Diffing operation, see udomdiff for more info
 * @returns The input node
 * @private
 */
function diffable(node: Node, operation: number): Node {
  if (node.nodeType === PERSIST_NODE_TYPE) {
    if (1 / operation < 0) {
      return operation ? remove(node) : node.lastChild;
    }
    return operation ? node.valueOf() as Node : node.firstChild;
  }

  return node;
}

/**
 * creates a persistent document fragment
 * @param frag - Document fragment to persist
 * @returns A synthetic Node that persist every descendent node
 * @private
 */
export function persistent(frag: DocumentFragment): Node {
  const children = frag.childNodes;
  // no content, return undefined (or first child)
  if (children.length < 2) return children[0];

  const nodes = Array.from(children);
  const nodeType = PERSIST_NODE_TYPE;
  function valueOf() {
    if (children.length !== nodes.length) {
      nodes.forEach(n => frag.appendChild(n));
    }
    return frag;
  }

  //@ts-ignore
  return { nodeType, valueOf, firstChild: nodes[0] };
}

/**
 * Diffs content after a specific reference node, from old content to new content
 * @param ref - Reference node, where to set content after
 * @param oldNodes - Current content of the node
 * @param newNodes - New nodes to replace the current content with
 * @returns The new nodes
 * @private
 */
export function diff(ref: Node, oldNodes: Node[], newNodes: Node[]): Node[] {
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
  return domdiff(ref.parentNode, oldNodes, newNodes, diffable, ref);
}

/**
 * Creates a template element from HTML or SVG markup
 * @param svg - Set to true to parse within the SVG namespace
 * @param markup - Markup, either HTML or SVG
 * @returns THe created template element
 * @private
 */
export function createTemplate(svg: boolean, markup: string): HTMLTemplateElement {
  const template = document.createElement('template');

  if (svg) {
    // Wrap in a svg element and then hoist the child nodes back to the root
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


/**
 * Least Recently Used (LRU) Weak Cache based on the builtin weakmap object
 * Records can be GC'd it will leave the keys.
 * This is fine however as they will be removed when space is required.
 */
export class LRUWeakMap<K extends object, V> extends WeakMap implements WeakMap<K, V> {
  /**
   * Keys where the first entry is least used.
   */
  private list: K[] = [];

  /** 
   * Maximum amount of entries to allow.
   */
  readonly max: number;

  /**
   * Constructs a new Least Recently Used (LRU) Weak Cache
   * @param size - Max size of this LRU map
   */
  constructor(size: number) {
    super();
    if (size <= 0) {
      throw new TypeError(`LRU Cache max size has to be positive integer larger than 0, got '${size}'.`);
    }

    this.max = size;
  }

  /**
   * Remove item from the map
   * @param key - Key to remove
   * @returns If deletion was successful
   */
  delete(key: K): boolean {
    // Remove key from keys list
    const idx = this.list.indexOf(key);
    if (idx != -1) {
      this.list.splice(idx, 1);
    }

    return super.delete(key);
  }

  /**
   * Gets a value from the cache
   * @param key - Key to get value from
   * @returns The returned value or null if not found
   */
  get(key: K): V|null {
    // pop the key to the top of the list
    const idx = this.list.lastIndexOf(key);
    if (idx < this.list.length - 1) {
      if (idx != -1) {
        this.list.splice(idx, 1);
      }

      this.list.push(key);
    }

    return super.get(key);
  }

  /**
   * Sets a value in the cache, also pushes the key to the top of the LRU
   * @param key - Key to set value to
   * @param value - Value to set
   * @returns This class to chain operations
   */
  set(key: K, value: V): this {
    // Pop the key to the top of the list
    const idx = this.list.indexOf(key);

    if (idx == -1) {
      if (this.max <= this.list.length) {
        // Cache is full, make space
        const [ tail ] = this.list.splice(0, 1);
        super.delete(tail);
      }
    } else if (idx < this.list.length - 1) {
      this.list.splice(idx, 1);
    }

    this.list.push(key);
    return super.set(key, value);
  }
}
