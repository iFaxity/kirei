// https://tc39.github.io/ecma262/#sec-typeof-operator
export type Primitive = null|undefined|boolean|number|string|Symbol|bigint;

//export const DEV = process.env.NODE_ENV != 'production';
export const IS_BROWSER = typeof window != 'undefined' && typeof window.document != 'undefined';

export function isPrimitive(value: unknown): value is Primitive {
  const type = typeof value;
  return value == null || type != 'object' && type != 'function';
}

/**
 * Checks if a variable is an object
 * @param {*} obj
 * @returns {boolean}
 */
export function isObject<T = object>(target: any): target is T {
  return target != null && typeof target == 'object';
}

/**
 * Checks if a variable is a function
 * @param {*} fn
 * @returns {boolean}
 */
export function isFunction(target: any): target is Function {
  return typeof target == 'function';
}

/**
 * Maps an object entries to another object, like array.map but for both keys and values
 * @param {Function} callback return a tuple (array) of [key, value]
 * @param {object} obj Object to map
 * @returns {object}
 */
export function mapObject<T, V>(callback: (key: string, value: any) => [ string, V ], obj: T): Record<string, V> {
  return Object.keys(obj).reduce((acc, key) => {
    let [ k, v ] = callback(key, obj[key]);
    acc[k] = v;

    return acc;
  }, {}) as Record<string, V>;
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

/**
 * Formats a console printable message
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {string}
 */
function formatMessage(message: string, ctx?: string) {
  ctx = ctx && ` in "${ctx}"`;
  return `[Shlim]: ${message}${ctx}`;
}

/**
 * Throws an exception with a formatted message
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {void}
 */
export function exception(message: string, ctx?: string): never {
  throw new Error(formatMessage(message, ctx));
}

/**
 * Logs an error message in the console
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {void}
 */
export function error(message: string, ctx?: string): void {
  console.error(formatMessage(message, ctx));
}

/**
 * Logs a warning message in the console
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {void}
 */
export function warn(message: string, ctx?: string): void {
  console.warn(formatMessage(message, ctx));
}
