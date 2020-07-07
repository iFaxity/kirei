import { Fx, TriggerOpTypes } from './fx';
import { toReactive } from './reactive';
import { isFunction, isObject } from '@kirei/shared';

export type Ref<T = any> = { value: T; };
export type RefTarget<T> = {
  get(): T;
  set(value: T): void;
};

// Prorotype for all ref types
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
 */
export function createRef<T>(target: RefTarget<T>): Ref<T> {
  const { get, set } = target ?? {};
  if (!isFunction(get)) {
    throw new TypeError(`Computed getter expects a function, got ${typeof target.get}`);
  } else if (set != null && !isFunction(set)) {
    throw new TypeError(`Computed setter expects a function, got ${typeof target.set}`);
  }

  return Object.defineProperty(Object.create(refProto), 'value', { get, set });
}

/**
 * Checks if an object is a reactive ref
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isRef(target: any): target is Ref {
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
 * Creates a reactive reference of a native value
 * @param {*} target
 * @returns {Ref}
 */
export function ref<T>(target?: T): Ref<T> {
  if (isRef(target)) return target;

  // if target is an object, wrap in a reactive
  let value = toReactive(target);
  const r = createRef<T>({
    get() {
      return Fx.track(r, 'value'), value;
    },
    set(newValue: T) {
      value = toReactive(newValue) as T;
      Fx.trigger(r, TriggerOpTypes.SET, 'value', value);
    },
  });

  return r;
}
