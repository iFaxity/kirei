import { mapObject } from '@kirei/shared';
import { isRef, Ref, createRef } from './ref';
import { toRaw, isObserver } from './reactive';

export { Fx, TriggerOpTypes } from './fx';
export * from './reactive';
export { Ref, isRef, unRef, ref } from './ref';
export { Computed, computed, computedGetter } from './computed';
export { watchEffect } from './watch';

/**
 * Unpacks a ref or reactive to it's raw value, otherwise returns target
 * @param {*} target - Target to unpack
 * @returns {*}
 */
export function toRawValue<T>(target: Ref<T>|T): T {
  return isRef(target) ? target.value : toRaw(target);
}

/**
 * Creates a ref wrapper from a property within a reactive object
 * @param {object} target
 * @param {key} string
 * @returns {Ref}
 */
export function toRef<T extends object>(target: object, key: string): Ref<T> {
  if (!isObserver(target)) {
    throw new TypeError(`toRef expected reactive, got ${target}`);
  }

  return createRef({
    get: () => target[key],
    set: (value) => target[key] = value,
  });
}

/**
 * Creates ref wrappers for all properties within a reactive object
 * @param {Proxy} target
 *
 * @return {object} of refs
 */
export function toRefs<T extends object>(target: T): Record<string, Ref<T>> {
  return mapObject((key) => [ key, toRef(target, key)], target);
}
