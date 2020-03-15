const COLLECTION_TYPES = [ Map, Set, WeakMap, WeakSet ];

export type MapCollection = Map<object, object> | WeakMap<object, object>;
export type SetCollection = Set<object> | WeakSet<object>;
export type Collection = Set<object> | Map<object, object>;
export type AnyCollection = MapCollection | SetCollection;
type Observable = object | AnyCollection;

export enum HookTypes {
  BEFORE_MOUNT = 'beforeMount',
  MOUNT = 'mount',
  BEFORE_UPDATE = 'beforeUpdate',
  UPDATE = 'update',
  BEFORE_UNMOUNT = 'beforeUnmount',
  UNMOUNT = 'unmount',
}

/**
 * Checks if a variable is an object
 * @param {*} obj
 * @returns {boolean}
 */
export function isObject<T = object>(obj: any): obj is T {
  return obj != null && typeof obj == 'object';
}


/**
 * Checks if a variable is a function
 * @param {*} fn
 * @returns {boolean}
 */
export function isFunction(fn: any): fn is Function {
  return typeof fn == 'function';
}


/**
 * Checks if a variable is a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export function isCollection(obj: any): obj is AnyCollection {
  return COLLECTION_TYPES.some(t => obj instanceof t);
}

/**
 * Checks if a variable is an object or a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export function isObservable(obj: any): obj is Observable {
  return isObject(obj) || isCollection(obj);
}

/**
 * Maps an object entries to another object, like array.map but for both keys and values
 * @param {Function} callback return a tuple (array) of [key, value]
 * @param {object} obj Object to map
 * @returns {object}
 */
export function mapObject<T, V>(callback: (key: string, value: any) => [ string, V ], obj: T): Record<string, V> {
  return Object.entries(obj).reduce((acc, [ key, value ]) => {
    let [ k, v ] = callback(key, value);
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
