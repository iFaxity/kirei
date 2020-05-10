import { Ref, RefTarget } from './ref';
declare type ComputedFunction<T> = () => T;
export declare type Computed<T> = ComputedFunction<T> | RefTarget<T>;
export declare function computedGetter<T>(getter: ComputedFunction<T>): (...args: any[]) => T;
/**
 * Creates a computed getter (and setter) as a ref object
 * @param {Function|object} target - function if getter only or object with get and set as functions.
 * @returns {Ref}
 */
export declare function computed<T>(target: Computed<T>): Ref<T>;
export {};
//# sourceMappingURL=computed.d.ts.map