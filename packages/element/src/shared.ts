const COLLECTION_TYPES = [ Map, Set, WeakMap, WeakSet ];

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
export function isObject(obj: any): boolean {
  return obj != null && typeof obj == 'object';
}


/**
 * Checks if a variable is a function
 * @param {*} fn
 * @returns {boolean}
 */
export function isFunction(fn: any): boolean {
  return typeof fn == 'function';
}


/**
 * Checks if a variable is a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export function isCollection(obj: any): boolean {
  return COLLECTION_TYPES.some(t => obj instanceof t);
}

/**
 * Checks if a variable is an object or a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export function isObservable(obj: any): boolean {
  return isObject(obj) || isCollection(obj);
}

/**
 * Maps an object entries to another object, like array.map but for both keys and values
 * @param callback return a tuple (array) of [key, value]
 * @param obj Object to map
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


