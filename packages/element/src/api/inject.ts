import { getCurrentInstance } from '../instance';
import { warn } from '../logging';

/**
 * Value to track if parameter is unset
 */
const UNSET = Object.create(null);

/**
 * Helps type inference when providing/injecting a key
 */
export interface InjectionKey<T> extends Symbol {}

/**
 * Provides a value to itself and children, used to flow data down, such as stores
 * @param key - Key to provide value as, can be a InjectionKey for type inference
 * @param value - Value to set to the provider
 */
export function provide<T>(key: InjectionKey<T>|string, value: T): void {
  const instance = getCurrentInstance();
  if (instance) {
    instance.provide(key, value);
  } else {
    warn(`provide() requires to have a setup function in its call stack.`, `provide(${key})`);
  }
}

/**
 * Gets a inherited value shared by any parent in the instance tree
 * @param key - Key of injected value
 * @param defaultValue - Fallback value in case of not being provided, defaults to undefined
 * @returns Default value if value waw not found otherwise undefined
 */
export function inject<T>(key: InjectionKey<T>|string, defaultValue?: T): T | undefined;
export function inject<T>(key: InjectionKey<T>|string, defaultValue: T = UNSET): T {
  const instance = getCurrentInstance();
  if (instance) {
    const { provides } = instance;
    const prop = key as string;

    if (prop in provides) {
      return provides[prop] as T;
    } else if (defaultValue !== UNSET) {
      return defaultValue;
    }

    // Explicit toString used as Symbols require it.
    warn(`Provider "${key.toString()}" not found, cannot inject.`, `inject(${key.toString()})`);
  } else {
    warn(`inject() requires to have a setup function in its call stack.`, `inject(${key.toString()})`);
  }
}
