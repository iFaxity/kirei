import type { Template } from '@kirei/html';
import { KireiInstance } from '../instance';
import { KireiElement } from '../element';
import { KireiError } from '../logging';
import { defineElement, html } from '../index';
import { compiler } from '../compiler';

// TODO: maybe clean up this code, and change it up a bit
type SuspenseFallback = (typeof KireiElement|Template);
type SuspenseTarget = typeof KireiElement|Promise<Template>;

// TODO multiple fallbacks?

/**
 * Shows fallback content until all elements has loaded
 * @param target - Target element as querySelector string
 * @param fallback - Template to render
 * @returns The resulting proxy node
 * @private
 */
export function suspense(fallback: Template | typeof KireiElement): Node {
  /*const instance = getCurrentInstance();

  if (!instance) {
    throw new KireiError(``, 'error', 'suspense');
  }*/

  // wait for elements to finish loading
  //instance.asyncResult;

  // await the asyncResult, show fallback until this is done
  //instance.asyncResult;

  // Create fallback content
  let node: Node;
  let multiple = false;

  if (fallback instanceof Template) {
    node = fallback.updateOnce();

    if (node instanceof DocumentFragment) {
      multiple = true;
    }
  } else {
    node = new fallback();
  }

  // cache the result??
  if (!Array.isArray(target)) {
    target = [ target ];
  }

  // if not promise, try get instance to get template property
  const promises = target.map(el => {
    if (el instanceof KireiElement) {
      const instance = KireiInstance.get(el);

      return Promise.resolve(instance.template).then(() => instance);
    }

    return el;
  });

  // Wait for all to complete
  Promise.all<Node|KireiInstance>(promises).then(results => {
    // replace fallback content with contents of x
    if (multiple) {
      node.childNodes.length;
    } else {

    }

    for (const result of results) {

    }
  });

  // return fallback, replace fallback when ok
  return node;
}
