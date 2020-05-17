import { isObject } from '@kirei/shared';
import { baseHandlers, collectionHandlers, REACTIVE_KEY } from './proxyHandlers';
import { isCollection } from './shared';
const targetToReactive = new WeakMap<any, any>();
const targetToReadonly = new WeakMap<any, any>();

/**
 * Checks if an object is a reactive object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isReactive(target: any): boolean {
  return !!target?.[REACTIVE_KEY];
}

/**
 * Unpacks a reactive to it's raw form, otherwise returns target
 * @param {object} target Target to convert
 * @returns {object}
 */
export function toRaw<T>(target: T): T {
  return target?.[REACTIVE_KEY] ?? target;
}

function observe<T extends object>(target: T, immutable: boolean): T {
  if (!isObject(target)) {
    throw new TypeError('Target is not observable');
  } else if (isReactive(target)) {
    return target;
  }

  const cache = immutable ? targetToReadonly : targetToReactive;
  let res: T = cache.get(target);

  if (!res) {
    const handlers = isCollection(target) ? collectionHandlers : baseHandlers;
    res = new Proxy(target, handlers(immutable, target));
  }
  return res;
}

/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function reactive<T extends object>(target: T): T {
  return observe(target, false);
}

/**
 * Creates a immutable reactive object
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function readonly<T extends object>(target: T): T {
  return observe(target, true);
}

/**
 * Tries to create target as a reactive.
 * Unlike reactive it returns original value instead of throwing error
 * @param {*} target Target to wrap
 * @returns {Proxy|*}
 */
export function toReactive<T>(target: T): T;
export function toReactive<T extends object>(target: T): T {
  try {
    return reactive(target);
  } catch (ex) {
    if (ex instanceof TypeError) {
      return target;
    }

    throw ex;
  }
}
