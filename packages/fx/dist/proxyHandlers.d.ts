export declare const REACTIVE_KEY: unique symbol;
/**
 * Proxy handlers for reactive objects and arrays
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 */
export declare function baseHandlers<T extends object>(immutable: boolean): ProxyHandler<T>;
/**
 * Proxy handlers for collection objects
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 */
export declare function collectionHandlers<T extends object>(immutable: boolean): ProxyHandler<T>;
//# sourceMappingURL=proxyHandlers.d.ts.map