import { isObject } from '@shlim/shared';
import { baseHandlers, collectionHandlers } from './proxyHandlers';
import { isObservable, isCollection } from './shared';

const reactiveMap = new WeakMap<any, any>();

/**
 * Returns a reactive from an object, native values are unchanged.
 * @param {*} target Target to check
 * @returns {Proxy|*}
 */
export function toReactive<T>(target: T): T;
export function toReactive<T extends object>(target: T): T {
  return isObject(target) ? reactive(target) : target;
}

/**
 * Checks if an object is a reactive object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isReactive(target: any): boolean {
  return reactiveMap.has(target);
}

/**
 * Unpacks a reactive to it's raw form, otherwise returns target
 * @param {object} target Target to convert
 * @returns {object}
 */
export function toRaw<T>(target: T): T {
  return reactiveMap.get(target) ?? target;
}

/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function reactive<T extends object>(target: T): T {
  let res: T = reactiveMap.get(target);

  if (!res) {
    let handlers: ProxyHandler<T>;

    if (isCollection(target)) {
      handlers = collectionHandlers(false);
    } else if (isObservable(target)) {
      handlers = baseHandlers(false);
    } else {
      throw new TypeError('target is not observable');
    }

    res = new Proxy(target, handlers);
    reactiveMap.set(res, target);
  }

  return res;
}

/**
 * Creates a immutable reactive object
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function readonly<T extends object>(target: T): T {
  let res: T = reactiveMap.get(target);

  if (!res) {
    let handlers: ProxyHandler<T>;

    if (isCollection(target)) {
      handlers = collectionHandlers(true);
    } else if (isObservable(target)) {
      handlers = baseHandlers(true);
    } else {
      throw new TypeError('target is not observable');
    }

    res = new Proxy(target, handlers);
    reactiveMap.set(res, target);
  }

  return res;
}
