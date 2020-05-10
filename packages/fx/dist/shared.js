"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
const COLLECTION_TYPES = [Map, Set, WeakMap, WeakSet];
/**
 * Checks if a variable is a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
function isCollection(target) {
    return COLLECTION_TYPES.some(t => target instanceof t);
}
exports.isCollection = isCollection;
/**
 * Checks if a variable is an object or a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
function isObservable(target) {
    return shared_1.isObject(target) || isCollection(target);
}
exports.isObservable = isObservable;
//# sourceMappingURL=shared.js.map