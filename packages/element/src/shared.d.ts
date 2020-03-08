export declare enum HookTypes {
    BEFORE_MOUNT = "beforeMount",
    MOUNT = "mount",
    BEFORE_UPDATE = "beforeUpdate",
    UPDATE = "update",
    BEFORE_UNMOUNT = "beforeUnmount",
    UNMOUNT = "unmount"
}
/**
 * Checks if a variable is an object
 * @param {*} obj
 * @returns {boolean}
 */
export declare function isObject(obj: any): boolean;
/**
 * Checks if a variable is a function
 * @param {*} fn
 * @returns {boolean}
 */
export declare function isFunction(fn: any): boolean;
/**
 * Checks if a variable is a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export declare function isCollection(obj: any): boolean;
/**
 * Checks if a variable is an object or a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export declare function isObservable(obj: any): boolean;
/**
 * Maps an object entries to another object, like array.map but for both keys and values
 * @param callback return a tuple (array) of [key, value]
 * @param obj Object to map
 * @returns {object}
 */
export declare function mapObject<T, V>(callback: (key: string, value: any) => [string, V], obj: T): Record<string, V>;
/**
 * Converts a CamelCased string to kebab-cased
 * @param {string} str string to convert
 * @returns {string}
 */
export declare function camelToKebab(str: string): string;
//# sourceMappingURL=shared.d.ts.map