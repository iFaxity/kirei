import { isObject } from '@shlim/shared';
import { baseHandlers, collectionHandlers } from './proxyHandlers';
import { isObservable, isCollection } from './shared';

// Reactive -> target
const reactiveToTarget = new WeakMap<any, any>();
const readonlyToTarget = new WeakMap<any, any>();
// target -> Reactive
const targetToReactive = new WeakMap<any, any>();
const targetToReadonly = new WeakMap<any, any>();

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
  return reactiveToTarget.has(target) || readonlyToTarget.has(target);
}

/**
 * Unpacks a reactive to it's raw form, otherwise returns target
 * @param {object} target Target to convert
 * @returns {object}
 */
export function toRaw<T>(target: T): T {
  return reactiveToTarget.get(target) ?? readonlyToTarget.get(target) ?? target;
}

/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function reactive<T extends object>(target: T): T {
  let res: T = targetToReactive.get(target);

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
    reactiveToTarget.set(res, target);
    targetToReactive.set(target, res);
  }

  return res;
}

/**
 * Creates a immutable reactive object
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function readonly<T extends object>(target: T): T {
  let res: T = targetToReadonly.get(target);

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
    readonlyToTarget.set(res, target);
    targetToReadonly.set(target, res);
  }

  return res;
}
