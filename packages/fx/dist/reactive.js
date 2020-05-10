"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
const proxyHandlers_1 = require("./proxyHandlers");
const shared_2 = require("./shared");
const targetToReactive = new WeakMap();
const targetToReadonly = new WeakMap();
function toReactive(target) {
    return shared_1.isObject(target) ? reactive(target) : target;
}
exports.toReactive = toReactive;
/**
 * Checks if an object is a reactive object
 * @param {*} target Target to check
 * @returns {boolean}
 */
function isReactive(target) {
    return !!target[proxyHandlers_1.REACTIVE_KEY];
}
exports.isReactive = isReactive;
/**
 * Unpacks a reactive to it's raw form, otherwise returns target
 * @param {object} target Target to convert
 * @returns {object}
 */
function toRaw(target) {
    var _a;
    return (_a = target[proxyHandlers_1.REACTIVE_KEY]) !== null && _a !== void 0 ? _a : target;
}
exports.toRaw = toRaw;
function createReactive(target, immutable) {
    if (shared_2.isCollection(target)) {
        return new Proxy(target, proxyHandlers_1.collectionHandlers(immutable));
    }
    else if (shared_2.isObservable(target)) {
        return new Proxy(target, proxyHandlers_1.baseHandlers(immutable));
    }
    throw new TypeError('target is not observable');
}
/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
function reactive(target) {
    let res = targetToReactive.get(target);
    if (!res) {
        targetToReactive.set(target, (res = createReactive(target, false)));
    }
    return res;
}
exports.reactive = reactive;
/**
 * Creates a immutable reactive object
 * @param {object} target - Object with own properties
 * @returns {Proxy}
 */
function readonly(target) {
    let res = targetToReadonly.get(target);
    if (!res) {
        targetToReadonly.set(target, (res = createReactive(target, false)));
    }
    return res;
}
exports.readonly = readonly;
//# sourceMappingURL=reactive.js.map