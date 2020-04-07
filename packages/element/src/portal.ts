import { Fx } from '@shlim/fx';
import { Template } from '@shlim/html';
import { render } from './compiler';
import { onMount, onUnmount } from './lifecycle';
import * as Queue from './queue';
import { FxInstance } from './instance';

/**
 * Portals content to a element, useful for popups
 * @param {string} target Target element as querySelector string
 * @param {Function} template Template to render
 * @returns {void}
 */
export function portal(target: string, templateFn: () => Template): void {
  const root = document.querySelector(target);
  const instance = FxInstance.active;

  const fx = new Fx(() => {
    FxInstance.active = instance;
    render(templateFn(), root);
    FxInstance.active = null;
  }, {
    lazy: true,
    scheduler: run => Queue.push(run),
  });

  // First run on mount
  onMount(() => fx.run());
  onUnmount(() => {
    fx.stop();
    render(null, root);
  });
}


