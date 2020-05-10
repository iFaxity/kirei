/**
 * Returns a reactive from an object, native values are unchanged.
 * @param {*} target Target to check
 * @returns {Proxy|*}
 */
export declare function toReactive<T>(target: T): T;
/**
 * Checks if an object is a reactive object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export declare function isReactive(target: any): boolean;
/**
 * Unpacks a reactive to it's raw form, otherwise returns target
 * @param {object} target Target to convert
 * @returns {object}
 */
export declare function toRaw<T>(target: T): T;
/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export declare function reactive<T extends object>(target: T): T;
/**
 * Creates a immutable reactive object
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
export declare function readonly<T extends object>(target: T): T;
//# sourceMappingURL=reactive.d.ts.map