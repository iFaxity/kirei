"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("@kirei/fx"));
var instance_1 = require("./instance");
exports.KireiElement = instance_1.KireiElement;
exports.KireiInstance = instance_1.KireiInstance;
exports.instances = instance_1.instances;
var queue_1 = require("./queue");
exports.nextTick = queue_1.nextTick;
var css_1 = require("./css");
exports.css = css_1.css;
var compiler_1 = require("./compiler");
exports.directive = compiler_1.directive;
exports.html = compiler_1.html;
exports.svg = compiler_1.svg;
__export(require("./api/lifecycle"));
var portal_1 = require("./api/portal");
exports.portal = portal_1.portal;
var inject_1 = require("./api/inject");
exports.provide = inject_1.provide;
exports.inject = inject_1.inject;
// import directives to load them
require("./directives/attrs");
require("./directives/if");
require("./directives/on");
require("./directives/ref");
require("./directives/show");
require("./directives/sync");
// expose defineElement function
const instance_2 = require("./instance");
const shared_1 = require("@kirei/shared");
const props_1 = require("./props");
/**
 * Collects an array of CSSResults into a Set of CSSResults to ensure they are unique
 * @param {CSSResult[]} styles Stylesheets to collect
 * @param {Set} set Set to hold all stylesheets
 * @returns {Set}
 */
function collectStyles(styles, set) {
    set = set !== null && set !== void 0 ? set : new Set();
    return styles.reduceRight((set, s) => Array.isArray(s) ? collectStyles(s, set) : (set.add(s), set), set);
}
/**
 * Normalizes the raw options object to a more predictable format
 * @param {ElementOptions} options Raw element options
 * @returns {NormalizedElementOptions}
 */
function normalizeOptions(options) {
    var _a, _b, _c, _d;
    let { styles } = options;
    const props = options.props ? props_1.normalizeProps(options.props) : {};
    if (styles != null) {
        styles = Array.isArray(styles) ? [...collectStyles(styles)] : [styles];
    }
    const normalized = options;
    normalized.props = props;
    normalized.styles = styles;
    normalized.closed = (_a = options.closed) !== null && _a !== void 0 ? _a : false;
    normalized.sync = (_b = options.sync) !== null && _b !== void 0 ? _b : 'value';
    normalized.setup = (_c = options.setup) !== null && _c !== void 0 ? _c : null;
    normalized.directives = (_d = options.directives) !== null && _d !== void 0 ? _d : null;
    normalized.tag = shared_1.camelToKebab(options.name);
    normalized.attrs = shared_1.mapObject((key) => [shared_1.camelToKebab(key), key], props);
    return normalized;
}
/**
 * Defines a new custom Kirei element
 * @param {ElementOptions} options - Raw element options
 * @returns {KireiElement}
 */
function defineElement(options) {
    var _a;
    const normalized = normalizeOptions(options);
    if (!normalized.tag.includes('-')) {
        shared_1.warn('Element names should include a hyphen (-) or be camelised with at least 2 upper-case characters', options.name);
    }
    // TODO HMR
    // if already defined then just override options
    const CustomElement = (_a = class extends instance_2.KireiElement {
        },
        _a.options = normalized,
        _a);
    window.customElements.define(CustomElement.is, CustomElement);
    return CustomElement;
}
exports.defineElement = defineElement;
//# sourceMappingURL=index.js.map