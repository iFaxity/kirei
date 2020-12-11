import { effect, stop } from '@vue/reactivity';
import type { ReactiveEffect } from '@vue/reactivity';
import { Template } from '@kirei/html';
import { render } from '../compiler';
import { onUnmount } from './lifecycle';
import * as Queue from '../queue';
import { getCurrentInstance, setCurrentInstance, KireiInstance } from '../instance';

const roots = new Map<string, Element>();
const portals = new WeakMap<Element, Portal>();
interface Portal {
  instance: KireiInstance;
  fx: ReactiveEffect;
}

// TODO: maybe clean up this code, and change it up a bit

/**
 * Portals content to a element, useful for dialogs
 * @param target - Target element as querySelector string
 * @param template - Template to render
 */
export function portal(target: string, templateFn: () => Template): void {
  const instance = getCurrentInstance();
  let root = roots.get(target);
  if (!root) {
    roots.set(target, (root = document.querySelector(target)));
  }

  let portal = portals.get(root);
  if (!portal || portal.instance !== instance) {
    const fx = effect(() => {
      setCurrentInstance(instance);
      render(templateFn(), root);
      setCurrentInstance(null);
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


