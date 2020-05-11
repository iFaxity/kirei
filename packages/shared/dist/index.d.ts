export declare type Primitive = null | undefined | boolean | number | string | symbol | bigint;
export declare const IS_BROWSER: boolean;
export declare function isPrimitive(value: unknown): value is Primitive;
/**
 * Checks if a variable is an object
 * @param {*} obj
 * @returns {boolean}
 */
export declare function isObject<T = object>(target: any): target is T;
/**
 * Checks if a variable is a function
 * @param {*} fn
 * @returns {boolean}
 */
export declare function isFunction(target: any): target is Function;
/**
 * Maps an object entries to another object, like array.map but for both keys and values
 * @param {Function} callback return a tuple (array) of [key, value]
 * @param {object} obj Object to map
 * @returns {object}
 */
export declare function mapObject<T, V>(callback: (key: string, value: any) => [string, V], obj: T): Record<string, V>;
/**
 * Converts a CamelCased string to kebab-cased
 * @param {string} str string to convert
 * @returns {string}
 */
export declare function camelToKebab(str: string): string;
/**
 * Throws an exception with a formatted message
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {void}
 */
export declare function exception(message: string, ctx?: string): never;
/**
 * Logs an error message in the console
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {void}
 */
export declare function error(message: string, ctx?: string): void;
/**
 * Logs a warning message in the console
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {void}
 */
export declare function warn(message: string, ctx?: string): void;
//# sourceMappingURL=index.d.ts.map