import { Component, normalizeOptions } from './runtime/component';
import { warn } from './logging';
import type { ComponentOptions, Props } from './types';

export * from '@vue/reactivity';
export { setCurrentInstance, getCurrentInstance } from './runtime/instance';
export { Component, normalizeOptions } from './runtime/component';
export { nextTick } from './runtime/queue';
export { css, CSSResult } from './runtime/css';
export { html, svg } from './runtime/compiler';
export * from './api/lifecycle';
export * from './api/inject';
export * from './api/portal';
export * from './api/watch';
export * from './api/app';
export type { ComponentOptions, ComponentInstance, UnwrapNestedRefs } from './types';

/**
 * Defines a new component
 * @param options - Raw element options
 * @returns A constructor to create a new Component element
 */
export function defineComponent<T extends Readonly<Props>>(options: ComponentOptions<T>): typeof Component {
  const normalized = normalizeOptions(options);
  if (!normalized.tag.includes('-')) {
    warn('Component names should include a hyphen (-) or be Pascal/camelCased with at least 1-2 upper-case character', options.name);
  }

  // TODO HMR, override options, then reflow all mounted elements
  // However element state cannot be saved this way.
  // if already defined then just override options
  const CustomComponent = class extends Component {
    static options = normalized;
  };

  window.customElements.define(CustomComponent.is, CustomComponent);
  return CustomComponent;
}

/**
 * Defines a asynchronously loaded component
 * @param options - Raw element options
 * @returns A promise that returns the created element class that extends HTMLElement
 */
export async function defineAsyncComponent<T extends Readonly<Props>>(options: () => Promise<ComponentOptions<T>>): Promise<typeof Component> {
  const opts = await Promise.resolve(options());
  return defineComponent(opts);
}
