"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fx_1 = require("./fx");
const reactive_1 = require("./reactive");
// Prorotype for all ref types
const refProto = Object.defineProperties(Object.create(null), {
    valueOf: {
        value() { return this.value; },
    },
    toString: {
        value() { return this.value.toString(); },
    },
});
/**
 * Creates a ref object from an object with a getter & setter for value
 * @param {object} target Target to create a ref from
 * @returns {Ref}
 */
function createRef(target) {
    const opts = { get: target.get, set: target.set };
    return Object.defineProperty(Object.create(refProto), 'value', opts);
}
exports.createRef = createRef;
/**
 * Checks if an object is a reactive ref
 * @param {*} target Target to check
 * @returns {boolean}
 */
function isRef(target) {
    return target != null && Object.getPrototypeOf(target) == refProto;
}
exports.isRef = isRef;
/**
 * Unpacks a ref object, if one was provided
 * @param {*} target
 * @returns {*}
 */
function unRef(target) {
    return isRef(target) ? target.value : target;
}
exports.unRef = unRef;
/**
 * Creates a reactive ref of a native value
 * Creates a ref
 * @param {null|undefined|number|string|boolean} target
 * @returns {Ref}
 */
function ref(target) {
    if (isRef(target))
        return target;
    // if target is object create proxy for it
    let value = reactive_1.toReactive(target);
    const r = createRef({
        get: () => {
            fx_1.Fx.track(r, 'value');
            return value;
        },
        set: (newValue) => {
            value = reactive_1.toReactive(newValue);
            fx_1.Fx.trigger(r, fx_1.TriggerOpTypes.SET, 'value');
        },
    });
    return r;
}
exports.ref = ref;
//# sourceMappingURL=ref.js.map