/*!
 * Based on https://github.com/vuejs/vue-next/blob/master/packages/reactivity
 * Copyright(c) 2019-2020 Vuejs Maintainers, http://vuejs.org
 * Copyright(c) 2020 Christian Norrman
 * MIT Licensed
 */
import { Fx, TriggerOpTypes } from './fx';
import { toReactive, toRaw } from './reactive';
import { isFunction } from '@kirei/shared';

/**
 * @interface
 */
export interface Ref<T = any> {
  /**
   * The current value of the ref
   * @var {T}
   */
  value: T;

  /**
   * Returns the value of the ref, same as accessing .value
   * @returns {T}
   */
  valueOf(): T;

  /**
   * Returns a string representation of the ref value
   * @returns {string}
   */
  toString(): string;
}

/**
 * @interface
 * @private
 */
export interface RefTarget<T> {
  get(): T;
  set(value: T): void;
}

/**
 * Prototype for all ref types
 * @const
 */
const refProto = Object.defineProperties(Object.create(null), {
  valueOf: {
    value() { return this.value; },
  },
  toString: {
    value() { return this.value.toString(); },
  },
});

/**
 * Creates a ref object from an object with a getter & setter for value
 * @param {RefTarget} target Target to create a ref from
 * @returns {Ref}
 * @private
 */
export function createRef<T>(target: RefTarget<T>): Ref<T> {
  const { get, set } = target ?? {};
  if (!isFunction(get)) {
    throw new TypeError(`Ref getter expects a function, got ${typeof target.get}`);
  } else if (set != null && !isFunction(set)) {
    throw new TypeError(`Ref setter expects a function, got ${typeof target.set}`);
  }

  return Object.defineProperty(Object.create(refProto), 'value', { get, set });
}

/**
 * Checks if an object is a reactive ref
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isRef<T = unknown>(target: any): target is Ref<T> {
  return Object.prototype.isPrototypeOf.call(refProto, target);
}

/**
 * Unpacks a ref object, if one was provided
 * @param {*} target
 * @returns {*}
 */
export function unRef<T>(target: Ref<T>|T): T {
  return isRef(target) ? target.value : target;
}

/**
 * Creates a reactive reference of a native value, forces objects to a reactive proxy
 * @param {*} target Initial value of the ref
 * @returns {Ref}
 */
export function ref<T>(target?: T|Ref<T>): Ref<T> {
  if (isRef<T>(target)) return target;

  // if target is an object, wrap in a reactive
  let value = toReactive(target);
  const r = createRef<T>({
    get() {
      return Fx.track(r, 'value'), value;
    },
    set(newValue) {
      value = toReactive(newValue);
      Fx.trigger(r, TriggerOpTypes.SET, 'value', value);
    },
  });

  return r;
}

/**
 * Creates a reactive reference of a native value, however does not force objects to a reactive proxy
 * @param {*} target Initial value of the ref
 * @returns {Ref}
 */
export function shallowRef<T>(target?: T|Ref<T>): Ref<T> {
  if (isRef<T>(target)) return target;

  // if target is an object, wrap in a reactive
  let value = toRaw(target);
  const r = createRef<T>({
    get() {
      return Fx.track(r, 'value'), value;
    },
    set(newValue) {
      value = toRaw(newValue);
      Fx.trigger(r, TriggerOpTypes.SET, 'value', newValue);
    },
  });

  return r;
}
