"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//export const DEV = process.env.NODE_ENV != 'production';
exports.IS_BROWSER = typeof window != 'undefined' && typeof window.document != 'undefined';
function isPrimitive(value) {
    const type = typeof value;
    return value == null || type != 'object' && type != 'function';
}
exports.isPrimitive = isPrimitive;
/**
 * Checks if a variable is an object
 * @param {*} obj
 * @returns {boolean}
 */
function isObject(target) {
    return target != null && typeof target == 'object';
}
exports.isObject = isObject;
/**
 * Checks if a variable is a function
 * @param {*} fn
 * @returns {boolean}
 */
function isFunction(target) {
    return typeof target == 'function';
}
exports.isFunction = isFunction;
/**
 * Maps an object entries to another object, like array.map but for both keys and values
 * @param {Function} callback return a tuple (array) of [key, value]
 * @param {object} obj Object to map
 * @returns {object}
 */
function mapObject(callback, obj) {
    return Object.keys(obj).reduce((acc, key) => {
        let [k, v] = callback(key, obj[key]);
        acc[k] = v;
        return acc;
    }, {});
}
exports.mapObject = mapObject;
/**
 * Converts a CamelCased string to kebab-cased
 * @param {string} str string to convert
 * @returns {string}
 */
function camelToKebab(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
        .toLowerCase();
}
exports.camelToKebab = camelToKebab;
/**
 * Formats a console printable message
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {string}
 */
function formatMessage(message, ctx) {
    ctx = ctx && ` in "${ctx}"`;
    return `[Kirei]: ${message}${ctx}`;
}
/**
 * Throws an exception with a formatted message
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {void}
 */
function exception(message, ctx) {
    throw new Error(formatMessage(message, ctx));
}
exports.exception = exception;
/**
 * Logs an error message in the console
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {void}
 */
function error(message, ctx) {
    console.error(formatMessage(message, ctx));
}
exports.error = error;
/**
 * Logs a warning message in the console
 * @param {string} message Exception message
 * @param {string} [ctx] Optional context (instance name, function name)
 * @returns {void}
 */
function warn(message, ctx) {
    console.warn(formatMessage(message, ctx));
}
exports.warn = warn;
//# sourceMappingURL=index.js.map
