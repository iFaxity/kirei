import { isObject } from '@shlim/shared';

const COLLECTION_TYPES = [ Map, Set, WeakMap, WeakSet ];
export type MapCollection = Map<object, object> | WeakMap<object, object>;
export type SetCollection = Set<object> | WeakSet<object>;
export type Collection = Set<object> | Map<object, object>;
export type AnyCollection = MapCollection | SetCollection;
export type Observable = object | AnyCollection;

/**
 * Checks if a variable is a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export function isCollection(target: any): target is AnyCollection {
  return COLLECTION_TYPES.some(t => target instanceof t);
}

/**
 * Checks if a variable is an object or a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export function isObservable(target: any): target is Observable {
  return isObject(target) || isCollection(target);
}
