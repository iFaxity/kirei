import { mapObject } from '@shlim/shared';
import { isRef, Ref, createRef } from './ref';
import { toRaw } from './reactive';

export { Fx, TriggerOpTypes } from './fx';
export { isReactive, toReactive, toRaw, reactive, readonly } from './reactive';
export { Ref, isRef, ref } from './ref';
export { Computed, computed } from './computed';

/**
 * Unpacks a ref or reactive to it's raw value, otherwise returns target
 * @param {*} target - Target to unpack
 * @returns {*}
 */
export function toRawValue(target: unknown): unknown {
  return isRef(target) ? target.value : toRaw(target);
}

/**
 * Creates a ref wrapper from a property within a reactive object
 * @param {object} target
 * @param {key} string
 * @returns {Ref}
 */
export function toRef<T extends object>(target: object, key: string): Ref<T> {
  return createRef<T>({
    get value() { return target[key]; },
    set value(newValue) { target[key] = newValue; }
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
