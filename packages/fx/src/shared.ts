const COLLECTION_TYPES = [ Map, Set, WeakMap, WeakSet ];
export type MapCollection = Map<any, any> | WeakMap<object, any>;
export type SetCollection = Set<any> | WeakSet<object>;
export type Collection = Set<any> | Map<any, any>;
export type AnyCollection = MapCollection | SetCollection;

/**
 * Checks if a variable is a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export function isCollection(target: any): target is AnyCollection {
  return COLLECTION_TYPES.some(t => target instanceof t);
}
