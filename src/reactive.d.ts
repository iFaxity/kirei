export interface FxRef<T = any> {
    value: T;
}
declare type Computed<T> = () => T;
interface ComputedOptions<T> {
    get(): T;
    set(newValue: T): void;
}
/**
 * Checks if an object is a reactive ref
 * @param {*} obj
 *
 * @return {boolean}
 */
export declare function isRef(obj: any): boolean;
/**
 * Checks if an object is a reactive object
 * @param {*} target
 *
 * @return {boolean}
 */
export declare function isReactive(target: any): boolean;
/**
 * Converts a reactive to it's raw object
 * @param {object} target
 *
 * @return {object}
 */
export declare function toRaw<T>(target: T): T;
/**
 * Gets a ref or reactive as raw value
 * @param {*} obj - value to convert
 *
 * @return {*}
 */
export declare function toRawValue(obj: unknown): unknown;
/**
 * Creates a ref object from a reactive prop
 * @param {object} target
 * @param {key} string
 *
 * @return {object}
 */
export declare function toRef<T extends object>(target: object, key: string): FxRef<T>;
/**
 * Converts a reactive into refs.
 * @param {Proxy} target
 *
 * @return {object} of refs
 */
export declare function toRefs<T extends object>(target: T): Record<string, FxRef<T>>;
/**
 * Creates a reactive ref of a native value
 * @param {null|undefined|number|string|boolean} target
 *
 * @return {object}
 */
export declare function ref<T>(target: T): FxRef<T>;
/**
 * Creates a computed getter (and setter)
 * @param {function|object} target - function if getter only or object with get and set as functions.
 *
 * @return {object}
 */
export declare function computed<T>(target: ComputedOptions<T> | Computed<T>): FxRef<T>;
/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 *
 * @return {Proxy}
 */
export declare function reactive<T extends object>(target: T): T;
/**
 * Creates a readonly reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 *
 * @return {Proxy}
 */
export declare function readonly<T extends object>(target: T): T;
/**
 * Creates a watcher that runs anytime a reactive value changes
 * @param {function} target
 *
 * @return {void}
 */
export declare function watch(target: Function): void;
export {};
//# sourceMappingURL=reactive.d.ts.map