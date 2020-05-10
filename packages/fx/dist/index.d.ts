import { Ref } from './ref';
export { Fx, TriggerOpTypes } from './fx';
export { isReactive, toReactive, toRaw, reactive, readonly } from './reactive';
export { Ref, isRef, unRef, ref } from './ref';
export { Computed, computed } from './computed';
export { watchFx } from './watch';
/**
 * Unpacks a ref or reactive to it's raw value, otherwise returns target
 * @param {*} target - Target to unpack
 * @returns {*}
 */
export declare function toRawValue(target: unknown): unknown;
/**
 * Creates a ref wrapper from a property within a reactive object
 * @param {object} target
 * @param {key} string
 * @returns {Ref}
 */
export declare function toRef<T extends object>(target: object, key: string): Ref<T>;
/**
 * Creates ref wrappers for all properties within a reactive object
 * @param {Proxy} target
 *
 * @return {object} of refs
 */
export declare function toRefs<T extends object>(target: T): Record<string, Ref<T>>;
//# sourceMappingURL=index.d.ts.map