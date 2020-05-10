export declare type MapCollection = Map<object, object> | WeakMap<object, object>;
export declare type SetCollection = Set<object> | WeakSet<object>;
export declare type Collection = Set<object> | Map<object, object>;
export declare type AnyCollection = MapCollection | SetCollection;
export declare type Observable = object | AnyCollection;
/**
 * Checks if a variable is a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export declare function isCollection(target: any): target is AnyCollection;
/**
 * Checks if a variable is an object or a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export declare function isObservable(target: any): target is Observable;
//# sourceMappingURL=shared.d.ts.map