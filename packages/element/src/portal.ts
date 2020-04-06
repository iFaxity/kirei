import { Fx, Ref } from '@shlim/fx';
import { Template, html } from '@shlim/html';
import { render } from './directive';
import { onMount, onUnmount } from './lifecycle';
import * as Queue from './queue';

/**
 * Portals content to another element, useful for popups
 * @param {string} target Target element as querySelector string
 * @param {Ref} active
 * @param {Function} template Template to render
 * @returns {void}
 */
export function portal(target: string, active: Ref<boolean>, templateFn: () => Template) {
  const root = document.querySelector(target);
  const fx = new Fx(() => {
    const tpl = active.value ? templateFn() : null;
    render(tpl, root);
  }, {
    lazy: true,
    scheduler: run => Queue.push(run),
  });

  // First run on mount
  onMount(() => fx.run());
  // Cleanup portal on unmount
  onUnmount(() => {
    fx.stop();
    render(null, root);
  });
}


