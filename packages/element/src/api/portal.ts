import { ReactiveEffect, effect, stop } from '@vue/reactivity';
import { Template } from '@kirei/html';
import { render } from '../compiler';
import { onUnmount } from './lifecycle';
import * as Queue from '../queue';
import { KireiInstance } from '../instance';

const roots = new Map<string, Element>();
const portals = new WeakMap<Element, Portal>();
interface Portal {
  instance: KireiInstance;
  fx: ReactiveEffect;
}

/**
 * Portals content to a element, useful for dialogs
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
    const fx = effect(() => {
      instance.activate();
      render(templateFn(), root);
      instance.deactivate();
    }, { scheduler: Queue.push });

    portal = { instance, fx };
    onUnmount(() => {
      const p = portals.get(root);
      stop(fx);

      if (p === portal) {
        render(null, root);
        portals.delete(root);
      }
    });

    portals.set(root, portal);
  }
}


