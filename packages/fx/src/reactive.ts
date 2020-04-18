import { isObject } from '@shlim/shared';
import { baseHandlers, collectionHandlers, REACTIVE_KEY } from './proxyHandlers';
import { isObservable, isCollection } from './shared';
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
  return !!target[REACTIVE_KEY];
}

/**
 * Unpacks a reactive to it's raw form, otherwise returns target
 * @param {object} target Target to convert
 * @returns {object}
 */
export function toRaw<T>(target: T): T {
  return target[REACTIVE_KEY] ?? target;
}

function createReactive<T extends object>(target: T, immutable: boolean): T {
  if (isCollection(target)) {
    return new Proxy(target, collectionHandlers(immutable));
  } else if (isObservable(target)) {
    return new Proxy(target, baseHandlers(immutable));
  }
  throw new TypeError('target is not observable');
}

/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function reactive<T extends object>(target: T): T {
  let res: T = targetToReactive.get(target);
  if (!res) {
    targetToReactive.set(target, (res = createReactive(target, false)));
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
    targetToReadonly.set(target, (res = createReactive(target, false)));
  }
  return res;
}
