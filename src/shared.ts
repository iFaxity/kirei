const collectionTypes = [ Map, Set, WeakMap, WeakSet ];

export function isObject(obj: any): boolean {
  return obj != null && typeof obj == 'object';
}

export function isFunction(fn: any): boolean {
  return typeof fn == 'function';
}

export function isCollection(obj: any): boolean {
  return collectionTypes.some(t => obj instanceof t);
}

export function isObservable(obj: any): boolean {
  return isObject(obj) || isCollection(obj);
}

export function mapObject<T, V>(callback: (key: string, value: any) => [ string, V ], obj: T): Record<string, V> {
  return Object.entries(obj).reduce((acc, [ key, value ]) => {
    let [ k, v ] = callback(key, value);
    acc[k] = v;

    return acc;
  }, {}) as Record<string, V>;
}

export function camelToKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase();
}


