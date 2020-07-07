import { isObject, isFunction } from '@kirei/shared';
import { createRef, Ref, RefTarget } from './ref';
import { Fx, activeFx } from './fx';

type ComputedFunction<T> = () => T;
export type Computed<T> = ComputedFunction<T> | RefTarget<T>;

export function computedGetter<T>(getter: ComputedFunction<T>): (...args: any[]) => T {
  let value: T;
  let dirty = true;
  const fx = new Fx(getter, {
    lazy: true,
    scheduler() { dirty = true; },
  });

  return (...args) => {
    if (dirty) {
      value = fx.run(...args);
      dirty = false;
    }

    // Add child dependents to activeFx object
    if (activeFx) {
      for (const dep of fx.deps) {
        if (!dep.has(activeFx)) {
          dep.add(activeFx);
          activeFx.deps.push(dep);
        }
      }
    }
    return value;
  };
}

/**
 * Creates a computed getter (and setter) as a ref object
 * @param {Function|object} target - function if getter only or object with get and set as functions.
 * @returns {Ref}
 */
export function computed<T>(target: Computed<T>): Ref<T> {
  let set: (newValue: T) => void;
  let get: () => T;

  if (isFunction(target)) {
    get = computedGetter(target);
  } else if (isObject<RefTarget<T>>(target)) {
    get = computedGetter(target.get);
    set = target.set;
  } else {
    throw new TypeError('Not a valid target');
  }

  return createRef({ get, set });
}
