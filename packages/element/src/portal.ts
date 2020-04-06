import { Fx } from '@shlim/fx';
import { render } from './directive';
import { onMount, onUnmount } from './lifecycle';
import { Template } from '@shlim/html';

/**
 * Portals content to another element, useful for popups
 * @param {string} target Target element as querySelector string
 * @param {Function} template Template to render
 * @returns {void}
 */
export function portal(target: string, templateFn: () => Template) {
  let root = document.querySelector(target);
  const fx = new Fx(() => render(templateFn(), root), { lazy: true });

  onMount(() => fx.run());
  // Cleanup portal on unmount
  onUnmount(() => render(null, root));
}


