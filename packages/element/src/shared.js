const COLLECTION_TYPES = [Map, Set, WeakMap, WeakSet];
export var HookTypes;
(function (HookTypes) {
    HookTypes["BEFORE_MOUNT"] = "beforeMount";
    HookTypes["MOUNT"] = "mount";
    HookTypes["BEFORE_UPDATE"] = "beforeUpdate";
    HookTypes["UPDATE"] = "update";
    HookTypes["BEFORE_UNMOUNT"] = "beforeUnmount";
    HookTypes["UNMOUNT"] = "unmount";
})(HookTypes || (HookTypes = {}));
/**
 * Checks if a variable is an object
 * @param {*} obj
 * @returns {boolean}
 */
export function isObject(obj) {
    return obj != null && typeof obj == 'object';
}
/**
 * Checks if a variable is a function
 * @param {*} fn
 * @returns {boolean}
 */
export function isFunction(fn) {
    return typeof fn == 'function';
}
/**
 * Checks if a variable is a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export function isCollection(obj) {
    return COLLECTION_TYPES.some(t => obj instanceof t);
}
/**
 * Checks if a variable is an object or a collection (Set, Map, WeakSet, WeakMap)
 * @param {*} obj
 * @returns {boolean}
 */
export function isObservable(obj) {
    return isObject(obj) || isCollection(obj);
}
/**
 * Maps an object entries to another object, like array.map but for both keys and values
 * @param callback return a tuple (array) of [key, value]
 * @param obj Object to map
 * @returns {object}
 */
export function mapObject(callback, obj) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        let [k, v] = callback(key, value);
        acc[k] = v;
        return acc;
    }, {});
}
/**
 * Converts a CamelCased string to kebab-cased
 * @param {string} str string to convert
 * @returns {string}
 */
export function camelToKebab(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
        .toLowerCase();
}
//# sourceMappingURL=shared.js.map