// https://tc39.github.io/ecma262/#sec-typeof-operator
export type Primitive = null|undefined|boolean|number|string|symbol|bigint;

/**
 * Checks if a variable is a primitive value (not object or function)
 * @param target - Target to check
 * @returns True if target is a primitive value
 */
export function isPrimitive(target: unknown): target is Primitive {
  const type = typeof target;
  return target == null || type != 'object' && type != 'function';
}

/**
 * Checks if a value is an object (i.e not a primitive)
 * @param target - Target to check
 * @returns True if target is an object
 */
export function isObject<T = object>(target: any): target is T {
  return target != null && typeof target == 'object';
}

/**
 * Checks if a value is a function
 * @param target - Target to check
 * @returns True if target is a function
 */
export function isFunction(target: any): target is Function {
  return typeof target == 'function';
}

/**
 * Checks if a value is a string
 * @param target - Target to check
 * @returns True if target is a string
 */
export function isString(target: any): target is string {
  return typeof target == 'string';
}

/**
 * Checks if a value is undefined
 * @param target - Target to check
 * @returns True if target is undefined
 */
export function isUndefined(target: any): target is undefined {
  return typeof target == 'undefined';
}

/**
 * Checks if a value is a Promise or a PromiseLike, aka an object with a then function.
 * @param target - Target to check
 * @returns True if target is a Promise or a PromiseLike
 */
export function isPromise<T = any>(target: any|PromiseLike<T>): target is Promise<T> {
  return typeof target?.then == 'function';
}

/**
 * Maps an object entries to another object, like array.map but for both keys and values
 * @param callback - A function that returns a tuple (array) of [key, value]
 * @param obj - Object to map
 * @returns An object mapped with the new keys and values
 */
export function mapObject<T, V, R = Record<string, V>>(callback: (key: string, value: any) => [ string, V ], obj: T): R {
  return Object.keys(obj).reduce((acc, key) => {
    const [ k, v ] = callback(key, obj[key]);
    acc[k] = v;

    return acc;
  }, {}) as R;
}
