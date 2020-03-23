import { isObject, isFunction } from '@shlim/shared';
import { createRef, Ref } from './ref';
import { Fx, activeFx } from './fx';

type ComputedFunction<T> = () => T;
interface ComputedOptions<T> {
  get(): T;
  set(newValue: T): void;
}
export type Computed<T> = ComputedFunction<T> | ComputedOptions<T>;

/**
 * Creates a computed getter (and setter) as a ref object
 * @param {Function|object} target - function if getter only or object with get and set as functions.
 * @returns {Ref}
 */
export function computed<T>(target: Computed<T>): Ref<T> {
  let setter: (newValue: T) => void;
  let getter: () => T;

  if (isFunction(target)) {
    getter = target.bind(null);
    setter = () => {};
  } else if (isObject(target)) {
    const obj = target as ComputedOptions<T>;

    getter = obj.get.bind(null);
    setter = obj.set.bind(null);
  } else {
    throw new TypeError('Not a valid target');
  }

  let value: T;
  let dirty = true;

  const fx = new Fx(getter, {
    lazy: true,
    computed: true,
    scheduler: () => { dirty = true; },
  });

  return createRef({
    get value() {
      if (dirty) {
        value = fx.run();
        dirty = false;
      }

      // Add child dependents to activeFx object
      if (activeFx != null) {
        for (const dep of fx.deps) {
          if (!dep.has(activeFx)) {
            dep.add(activeFx);
            activeFx.deps.push(dep);
          }
        }
      }

      return value;
    },
    set value(newValue) {
      setter(newValue);
    },
  });
}
