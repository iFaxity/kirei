import { Fx, TriggerOpTypes } from './fx';
import { toReactive } from './reactive';

export type Ref<T = any> = { value: T; };
const REF_KEY = Symbol('ref');

/**
 * Creates a ref object from an object with a getter & setter for value
 * @param {object} target Target to create a ref from
 * @returns {Ref}
 */
export function createRef<T>(target: object): Ref<T> {
  return (target[REF_KEY] = true) && target as Ref<T>;
}

/**
 * Checks if an object is a reactive ref
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isRef(target: any): target is Ref {
  return target != null && !!target[REF_KEY];
}


/**
 * Creates a reactive ref of a native value
 * Creates a ref
 * @param {null|undefined|number|string|boolean} target
 * @returns {Ref}
 */
export function ref<T>(target: T): Ref<T> {
  if (isRef(target)) return target;

  // if target is object create proxy for it
  let value = toReactive(target);
  const r = {
    get value(): T {
      Fx.track(r, 'value');
      return value;
    },
    set value(newValue: T) {
      value = toReactive(newValue) as T;
      Fx.trigger(r, TriggerOpTypes.SET, 'value');
    },
  };

  return createRef<T>(r);
}

