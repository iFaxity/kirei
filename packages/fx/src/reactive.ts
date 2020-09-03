/*!
 * Based on https://github.com/vuejs/vue-next/blob/master/packages/reactivity
 * Copyright(c) 2019-2020 Vuejs Maintainers, http://vuejs.org
 * Copyright(c) 2020 Christian Norrman
 * MIT Licensed
 */
import { isObject } from '@kirei/shared';
import { baseHandlers, collectionHandlers, REACTIVE_KEY, READONLY_KEY, OBSERVER_KEY } from './proxyHandlers';
import { isCollection } from './shared';

/**
 * Recursively immutable observable object
 * @type
 */
//export type Readonly<T = unknown> = { readonly [P in keyof T]: T[P] extends object ? Readonly<T[P]> : T[P] };
//export type Reactive<T = unknown> = { [P in keyof T]: T[P] extends object ? Reactive<T[P]> : T[P] };

// TODO: make readonly deep
// TODO: better type inferance

/**
 * Recursive mutable observable object
 * @type
 */
export type Reactive<T> = { [P in keyof T]: T[P] };

/**
 * Type for a Observable, mutable or immutable
 * @type
 */
type Observer<T> = Readonly<T> | Reactive<T>;

/**
 * Weak cache to resolve targets to a mutable observer
 * @const
 */
const targetToReactive = new WeakMap<any, Reactive<any>>();

/**
 * Weak cache to resolve targets to a immutable observer
 * @const
 */
const targetToReadonly = new WeakMap<any, Readonly<any>>();

/**
 * Wraps an object into an observeble proxy
 * @param {object} target Target to check
 * @param {boolean} immutable If proxy should be readonly
 */
function observe<T extends object>(target: T, immutable: boolean): Observer<T> {
  const raw = toRaw(target);
  const cache = immutable ? targetToReadonly : targetToReactive;
  let res: T = cache.get(raw);

  if (!res) {
    const handlers = isCollection(raw) ? collectionHandlers : baseHandlers;
    cache.set(raw, res = new Proxy(raw, handlers(immutable, raw)));
  }
  return res;
}

/**
 * Checks if an object is an observer object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isObserver<T>(target: T): target is Observer<T> {
  return !!target?.[OBSERVER_KEY];
}

/**
 * Checks if an object is a reactive object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isReactive<T>(target: T): target is Reactive<T> {
  return !!target?.[REACTIVE_KEY];
}

/**
 * Checks if an object is a readonly object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isReadonly<T>(target: T): target is Readonly<T> {
  return !!target?.[READONLY_KEY];
}

/**
 * Unpacks a observer to it's raw form, otherwise returns target
 * @param {object} target Target to convert
 * @returns {object}
 */
export function toRaw<T>(target: T|Reactive<T>|Readonly<T>): T {
  return target?.[OBSERVER_KEY] ?? target;
}

/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function reactive<T extends object>(target: T): Reactive<T> {
  if (!isObject(target)) {
    throw new TypeError('Target is not observable');
  }
  return isReactive(target) ? target : observe(target, false);
}

/**
 * Creates a immutable reactive object
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export function readonly<T extends object>(target: T): Readonly<T> {
  if (!isObject(target)) {
    throw new TypeError('Target is not observable');
  }
  return isReadonly(target) ? target : observe(target, true);
}

/**
 * Tries to create target as a reactive.
 * Unlike reactive it returns original value instead of throwing error
 * @param {*} target Target to wrap
 * @returns {Proxy|*}
 */
export function toReactive<T>(target: T): Reactive<T>;
export function toReactive<T extends object>(target: T): Reactive<T> {
  return isObject(target) ? observe(target, false) : target;
}

/**
 * Tries to create target as a readonly.
 * Unlike readonly it returns original value instead of throwing error
 * @param {*} target Target to wrap
 * @returns {Proxy|*}
 */
export function toReadonly<T>(target: T): Readonly<T>;
export function toReadonly<T extends object>(target: T): Readonly<T> {
  return isObject(target) ? observe(target, true) : target;
}
