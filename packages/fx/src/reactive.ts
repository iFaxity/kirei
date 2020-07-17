/*!
 * Based on https://github.com/vuejs/vue-next/blob/master/packages/reactivity
 * Copyright(c) 2019-2020 Vuejs Maintainers, http://vuejs.org
 * Copyright(c) 2020 Christian Norrman
 * MIT Licensed
 */
import { isObject } from '@kirei/shared';
import { baseHandlers, collectionHandlers, REACTIVE_KEY, READONLY_KEY, OBSERVER_KEY } from './proxyHandlers';
import { isCollection } from './shared';
const targetToReactive = new WeakMap<any, any>();
const targetToReadonly = new WeakMap<any, any>();

function observe<T extends object>(target: T, immutable: boolean): T {
  if (!isObject(target)) {
    throw new TypeError('Target is not observable');
  }

  const cache = immutable ? targetToReadonly : targetToReactive;
  let res: T = cache.get(target);

  if (!res) {
    const handlers = isCollection(target) ? collectionHandlers : baseHandlers;
    res = new Proxy(target, handlers(immutable, target));
    cache.set(target, res);
  }
  return res;
}

/**
 * Checks if an object is an observer object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isObserver(target: any): boolean {
  return !!target?.[OBSERVER_KEY];
}

/**
 * Checks if an object is a reactive object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isReactive(target: any): boolean {
  return !!target?.[REACTIVE_KEY];
}

/**
 * Checks if an object is a readonly object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isReadonly(target: any): boolean {
  return !!target?.[READONLY_KEY];
}

/**
 * Unpacks a observer to it's raw form, otherwise returns target
 * @param {object} target Target to convert
 * @returns {object}
 */
export function toRaw<T>(target: T): T {
  return target?.[OBSERVER_KEY] ?? target;
}

/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function reactive<T extends object>(target: T): T {
  if (isReactive(target)) {
    return target;
  }
  return observe(toRaw(target), false);
}

/**
 * Creates a immutable reactive object
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function readonly<T extends object>(target: T): Readonly<T> {
  if (isReadonly(target)) {
    return target;
  }
  return observe(toRaw(target), true);
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

/**
 * Tries to create target as a readonly.
 * Unlike readonly it returns original value instead of throwing error
 * @param {*} target Target to wrap
 * @returns {Proxy|*}
 */
export function toReadonly<T>(target: T): T;
export function toReadonly<T extends object>(target: T): T {
  try {
    return readonly(target);
  } catch (ex) {
    if (ex instanceof TypeError) {
      return target;
    }

    throw ex;
  }
}
