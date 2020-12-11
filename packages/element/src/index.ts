import { KireiElement, normalizeOptions } from './element';
import { warn } from './logging';
import type { ElementOptions, Props } from './interfaces';

export * from '@vue/reactivity';
export { KireiInstance, setCurrentInstance, getCurrentInstance } from './instance';
export { KireiElement, normalizeOptions } from './element';
export { nextTick } from './queue';
export { css, CSSResult } from './css';
export { html, svg } from './compiler';
export * from './api/lifecycle';
export * from './api/inject';
export * from './api/portal';
export * from './api/watch';
export { createApp } from './app';
export type { App } from './app';
export type { ElementOptions } from './interfaces';

/**
 * Defines a new custom Kirei element
 * @param options - Raw element options
 * @returns The created element class that extends HTMLElement
 */
export function defineElement<T extends Readonly<Props>>(options: ElementOptions<T>): typeof KireiElement {
  const normalized = normalizeOptions(options);
  if (!normalized.tag.includes('-')) {
    warn('Element names should include a hyphen (-) or be Pascal/camelCased with at least 1-2 upper-case character', options.name);
  }

  // TODO HMR, override options, then reflow all mounted elements
  // However element state cannot be saved this way.
  // if already defined then just override options
  const CustomElement = class extends KireiElement {
    static options = normalized;
  };

  window.customElements.define(CustomElement.is, CustomElement);
  return CustomElement;
}

/**
 * Defines a asynchronously loaded element
 * @param options - Raw element options
 * @returns A promise that returns the created element class that extends HTMLElement
 */
export async function defineAsyncElement<T extends Readonly<Props>>(options: () => Promise<ElementOptions<T>>): Promise<typeof KireiElement> {
  const opts = await Promise.resolve(options());
  return defineElement(opts);
}
