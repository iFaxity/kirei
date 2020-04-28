import { Fx } from '@kirei/fx';
import { Template } from '@kirei/html';
import { render } from '../compiler';
import { onUnmount } from './lifecycle';
import * as Queue from '../queue';
import { KireiInstance } from '../instance';

const roots = new Map<string, Element>();
const portals = new WeakMap<Element, Portal>();
interface Portal {
  instance: KireiInstance;
  fx: Fx;
}

/**
 * Portals content to a element, useful for popups
 * @param {string} target Target element as querySelector string
 * @param {Function} template Template to render
 * @returns {void}
 */
export function portal(target: string, templateFn: () => Template): void {
  const instance = KireiInstance.active;
  let root = roots.get(target);
  if (!root) {
    roots.set(target, (root = document.querySelector(target)));
  }

  let portal = portals.get(root);
  if (!portal || portal.instance !== instance) {
    const fx = new Fx(() => {
      KireiInstance.active = instance;
      render(templateFn(), root);
      KireiInstance.resetActive();
    }, { scheduler: Queue.push });

    portal = { instance, fx };
    onUnmount(() => {
      const p = portals.get(root);
      fx.stop();
      if (p === portal) {
        render(null, root);
        portals.delete(root);
      }
    });

    portals.set(root, portal);
  }
}


