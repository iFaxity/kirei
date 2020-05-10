export declare type Ref<T = any> = {
    value: T;
};
export declare type RefTarget<T> = {
    get(): T;
    set(value: T): void;
};
/**
 * Creates a ref object from an object with a getter & setter for value
 * @param {object} target Target to create a ref from
 * @returns {Ref}
 */
export declare function createRef<T>(target: RefTarget<T>): Ref<T>;
/**
 * Checks if an object is a reactive ref
 * @param {*} target Target to check
 * @returns {boolean}
 */
export declare function isRef(target: any): target is Ref;
/**
 * Unpacks a ref object, if one was provided
 * @param {*} target
 * @returns {*}
 */
export declare function unRef(target: any): any;
/**
 * Creates a reactive ref of a native value
 * Creates a ref
 * @param {null|undefined|number|string|boolean} target
 * @returns {Ref}
 */
export declare function ref<T>(target: T): Ref<T>;
//# sourceMappingURL=ref.d.ts.map