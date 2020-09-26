// https://tc39.github.io/ecma262/#sec-typeof-operator
export type Primitive = null|undefined|boolean|number|string|symbol|bigint;

/**
 * True if the current environment is in developer mode
 * @const {boolean}
 */
export const DEV = typeof process == 'object' && process.env?.NODE_ENV != 'production';

/**
 * True if the current environment is in the browser
 * @const {boolean}
 */
export const IS_BROWSER = typeof window != 'undefined' && typeof window.document != 'undefined';

/**
 * Checks if a variable is a primitive value (not object or function)
 * @param {*} target
 * @returns {boolean}
 */
export function isPrimitive(target: unknown): target is Primitive {
  const type = typeof target;
  return target == null || type != 'object' && type != 'function';
}

/**
 * Checks if a value is an object
 * @param {*} target
 * @returns {boolean}
 */
export function isObject<T = object>(target: any): target is T {
  return target != null && typeof target == 'object';
}

/**
 * Checks if a value is a function
 * @param {*} target
 * @returns {boolean}
 */
export function isFunction(target: any): target is Function {
  return typeof target == 'function';
}

/**
 * Checks if a value is a string
 * @param {*} target
 * @returns {boolean}
 */
export function isString(target: any): target is string {
  return typeof target == 'string';
}

/**
 * Checks if a value is undefined
 * @param {*} target
 * @returns {boolean}
 */
export function isUndefined(target: any): target is undefined {
  return typeof target == 'undefined';
}

/**
 * Checks if a value is a Promise or a PromiseLike, aka an object with a then function.
 * @param {*} target
 * @returns {boolean}
 */
export function isPromise<T = any>(target: any|PromiseLike<T>): target is Promise<T> {
  return typeof target?.then == 'function';
}

/**
 * Maps an object entries to another object, like array.map but for both keys and values
 * @param {Function} callback return a tuple (array) of [key, value]
 * @param {object} obj Object to map
 * @returns {object}
 */
export function mapObject<T, V, R = Record<string, V>>(callback: (key: string, value: any) => [ string, V ], obj: T): R {
  return Object.keys(obj).reduce((acc, key) => {
    let [ k, v ] = callback(key, obj[key]);
    acc[k] = v;

    return acc;
  }, {}) as R;
}
