import { Component } from '../runtime/component';
import { isFunction } from '@vue/shared';

export type AsyncComponentResolveResult<T = Component> = T | { default: T }; // es modules
export type AsyncComponentLoader<T = any> = () => Promise<AsyncComponentResolveResult<T>>;

export interface AsyncComponentOptions<T = any> {
  loader: AsyncComponentLoader<T>;
  loadingComponent?: Component;
  errorComponent?: Component;
  delay?: number; // default: 200
  timeout?: number; // default: Infinity
  suspensible?: boolean, // default: true
  onError?(error: Error, retry: () => void, fail: () => void, attempts: number): any;
}

/**
 * Defines a asynchronously loaded component
 * @param options - Raw element options
 * @returns A promise that returns the created element class that extends HTMLElement
 */
export function defineAsyncComponent<T extends Component>(options: AsyncComponentLoader<T> | AsyncComponentOptions<T>): T {
  let opts: AsyncComponentOptions = {
    loader: null,
    delay: 200,
    timeout: null,
    suspensible: true,
  };

  if (isFunction(options)) {
    opts.loader = options;
  } else {
    Object.assign(opts, options);
  }

  return null as T;
}
