import { KireiInstance } from '../instance';
import { warn } from '../logging';

/**
 * Helps type inference when providing/injecting a key
 * @type
 */
export interface InjectionKey<T> extends Symbol {}

/**
 * Provides a value to itself and children, used to flow data down, such as stores
 * @param {InjectionKey<T>|string} key Key to provide value as, can be a InjectionKey for type inference
 * @param {T} value Value to set to the provider
 * @returns {T|undefined}
 */
export function provide<T>(key: InjectionKey<T>|string, value: T): void {
  const instance = KireiInstance.active;
  instance.provide(key, value);
}

/**
 * Gets a inherited value shared by any parent in the instance tree
 * @param {InjectionKey<T>|string} key Key of provided value
 * @param {T} defaultValue Fallback value in case of not being set, defaults to undefined
 * @returns {T|undefined}
 */
export function inject<T>(key: InjectionKey<T>|string, defaultValue?: T): T | undefined;
export function inject<T>(key: InjectionKey<T>|string, ...args: T[]): T {
  const instance = KireiInstance.active;
  if (instance) {
    const { provides } = instance;
    const prop = key as string;

    if (prop in provides) {
      return provides[prop];
    } else if (args.length) {
      return args[0];
    }

    warn(`Provider "${key}" not found, cannot inject.`, `inject(${key})`);
  } else {
    warn(`inject() requires to have a setup function in its call stack.`, `inject(${key})`);
  }
}
