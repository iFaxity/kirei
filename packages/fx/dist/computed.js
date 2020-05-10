"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
const ref_1 = require("./ref");
const fx_1 = require("./fx");
function computedGetter(getter) {
    let value;
    let dirty = true;
    const fx = new fx_1.Fx(getter, {
        lazy: true,
        computed: true,
        scheduler: () => { dirty = true; },
    });
    return (...args) => {
        if (dirty) {
            value = fx.run(...args);
            dirty = false;
        }
        // Add child dependents to activeFx object
        if (fx_1.activeFx) {
            for (const dep of fx.deps) {
                if (!dep.has(fx_1.activeFx)) {
                    dep.add(fx_1.activeFx);
                    fx_1.activeFx.deps.push(dep);
                }
            }
        }
        return value;
    };
}
exports.computedGetter = computedGetter;
/**
 * Creates a computed getter (and setter) as a ref object
 * @param {Function|object} target - function if getter only or object with get and set as functions.
 * @returns {Ref}
 */
function computed(target) {
    let set;
    let get;
    if (shared_1.isFunction(target)) {
        get = computedGetter(target);
    }
    else if (shared_1.isObject(target)) {
        get = computedGetter(target.get);
        set = target.set;
    }
    else {
        throw new TypeError('Not a valid target');
    }
    return ref_1.createRef({ get, set });
}
exports.computed = computed;
//# sourceMappingURL=computed.js.map