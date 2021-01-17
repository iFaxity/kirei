/**
 * Checks if a value is an object (i.e not a primitive)
 * @param target - Target to check
 * @returns True if target is an object
 */
export function isObject<T = object>(target: any): target is T {
  return target != null && typeof target == 'object';
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
