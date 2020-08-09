// https://tc39.github.io/ecma262/#sec-typeof-operator
export type Primitive = null|undefined|boolean|number|string|symbol|bigint;

//export const DEV = process.env.NODE_ENV != 'production';
export const IS_BROWSER = typeof window != 'undefined' && typeof window.document != 'undefined';

/**
 * Checks if a variable is a primitive value (not object or function)
 * @param {*} value
 * @returns {boolean}
 */
export function isPrimitive(value: unknown): value is Primitive {
  const type = typeof value;
  return value == null || type != 'object' && type != 'function';
}

/**
 * Checks if a value is an object
 * @param {*} value
 * @returns {boolean}
 */
export function isObject<T = object>(value: any): value is T {
  return value != null && typeof value == 'object';
}

/**
 * Checks if a value is a function
 * @param {*} fn
 * @returns {boolean}
 */
export function isFunction(value: any): value is Function {
  return typeof value == 'function';
}

/**
 * Checks if a value is a string
 * @param {*} value
 * @returns {boolean}
 */
export function isString(value: any): value is string {
  return typeof value == 'string';
}

/**
 * Checks if a value is undefined
 * @param {*} value
 * @returns {boolean}
 */
export function isUndefined(value: any): value is undefined {
  return typeof value == 'undefined';
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

/**
 * Converts a CamelCased string to kebab-cased
 * @param {string} str string to convert
 * @returns {string}
 */
export function camelToKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase();
}
