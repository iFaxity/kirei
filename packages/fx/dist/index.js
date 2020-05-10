"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
const ref_1 = require("./ref");
const reactive_1 = require("./reactive");
var fx_1 = require("./fx");
exports.Fx = fx_1.Fx;
exports.TriggerOpTypes = fx_1.TriggerOpTypes;
var reactive_2 = require("./reactive");
exports.isReactive = reactive_2.isReactive;
exports.toReactive = reactive_2.toReactive;
exports.toRaw = reactive_2.toRaw;
exports.reactive = reactive_2.reactive;
exports.readonly = reactive_2.readonly;
var ref_2 = require("./ref");
exports.isRef = ref_2.isRef;
exports.unRef = ref_2.unRef;
exports.ref = ref_2.ref;
var computed_1 = require("./computed");
exports.computed = computed_1.computed;
var watch_1 = require("./watch");
exports.watchFx = watch_1.watchFx;
/**
 * Unpacks a ref or reactive to it's raw value, otherwise returns target
 * @param {*} target - Target to unpack
 * @returns {*}
 */
function toRawValue(target) {
    return shared_1.isObject(target) ? (ref_1.isRef(target) ? target.value : reactive_1.toRaw(target)) : target;
}
exports.toRawValue = toRawValue;
/**
 * Creates a ref wrapper from a property within a reactive object
 * @param {object} target
 * @param {key} string
 * @returns {Ref}
 */
function toRef(target, key) {
    return ref_1.createRef({
        get: () => target[key],
        set: (value) => target[key] = value,
    });
}
exports.toRef = toRef;
/**
 * Creates ref wrappers for all properties within a reactive object
 * @param {Proxy} target
 *
 * @return {object} of refs
 */
function toRefs(target) {
    return shared_1.mapObject((key) => [key, toRef(target, key)], target);
}
exports.toRefs = toRefs;
//# sourceMappingURL=index.js.map