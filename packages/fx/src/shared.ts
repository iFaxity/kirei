const COLLECTION_TYPES = [ Map, Set, WeakMap, WeakSet ];

/**
 * @type
 * @private
 */
export type MapCollection = Map<any, any> | WeakMap<object, any>;

/**
 * @type
 * @private
 */
export type SetCollection = Set<any> | WeakSet<object>;

/**
 * @type
 * @private
 */
export type Collection = Set<any> | Map<any, any>;

/**
 * @type
 * @private
 */
export type AnyCollection = MapCollection | SetCollection;

/**
 * Checks if a variable is a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 * @private
 */
export function isCollection(target: any): target is AnyCollection {
  return COLLECTION_TYPES.some(t => target instanceof t);
}
