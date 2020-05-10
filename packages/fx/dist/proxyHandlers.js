"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
const fx_1 = require("./fx");
const ref_1 = require("./ref");
const reactive_1 = require("./reactive");
const arrayShims = ['indexOf', 'lastIndexOf', 'includes'];
exports.REACTIVE_KEY = Symbol('reactive');
/**
 * Shim for array search functions: indexOf, lastIndexOf and includes
 * @param {*} target Reactive target
 * @param {string} key Array function key
 * @param {*} receiver Target array
 * @returns {Function}
 */
function arraySearchShim(target, key) {
    return (...args) => {
        const self = reactive_1.toRaw(target);
        const len = self.length;
        // Track all indicies for this effect
        for (let i = 0; i < len; i++) {
            fx_1.Fx.track(self, i + '');
        }
        // Args may be reactive, but we try first anyway
        const res = self[key](...args);
        // If res was negative, re-run it again with raw arguments
        if (res === -1 || res === false) {
            return self[key](...args.map(reactive_1.toRaw));
        }
        return res;
    };
}
/**
 * Proxy handlers for reactive objects and arrays
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 */
function baseHandlers(immutable) {
    return {
        get(target, key, receiver) {
            // used for reactive unwrapping & detection
            if (key === exports.REACTIVE_KEY)
                return target;
            const isArray = Array.isArray(target);
            if (isArray && arrayShims.includes(key)) {
                return arraySearchShim(receiver, key);
            }
            const res = target[key];
            if (ref_1.isRef(res) && !isArray) {
                return res.value;
            }
            fx_1.Fx.track(target, key);
            return shared_1.isObject(res) ? (immutable ? reactive_1.readonly(res) : reactive_1.reactive(res)) : res;
        },
        set(target, key, newValue, receiver) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            const oldValue = target[key];
            newValue = reactive_1.toRaw(newValue);
            if (ref_1.isRef(oldValue) && !ref_1.isRef(newValue)) {
                oldValue.value = newValue;
                return true;
            }
            const added = !target.hasOwnProperty(key);
            const res = Reflect.set(target, key, newValue);
            // Only trigger change it target and receiver matches
            if (target === reactive_1.toRaw(receiver)) {
                if (added) {
                    fx_1.Fx.trigger(target, fx_1.TriggerOpTypes.ADD, key);
                }
                else if (newValue !== oldValue && (newValue === newValue || oldValue === oldValue)) {
                    fx_1.Fx.trigger(target, fx_1.TriggerOpTypes.SET, key);
                }
            }
            return res;
        },
        deleteProperty(target, key) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            const res = delete target[key];
            if (res && target.hasOwnProperty(key)) {
                fx_1.Fx.trigger(target, fx_1.TriggerOpTypes.DELETE, key);
            }
            return res;
        },
        has(target, key) {
            fx_1.Fx.track(target, key);
            return key in target;
        },
        ownKeys(target) {
            fx_1.Fx.track(target, fx_1.ITERATE_KEY);
            return Reflect.ownKeys(target);
        },
    };
}
exports.baseHandlers = baseHandlers;
/**
 * Proxy handlers for collection objects
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 */
function collectionHandlers(immutable) {
    const methods = {
        get(key) {
            const target = reactive_1.toRaw(this);
            key = reactive_1.toRaw(key);
            fx_1.Fx.track(target, key);
            return reactive_1.toReactive(target.get(key));
        },
        get size() {
            const target = reactive_1.toRaw(this);
            fx_1.Fx.track(target, fx_1.ITERATE_KEY);
            return target.size;
        },
        has(key) {
            const target = reactive_1.toRaw(this);
            key = reactive_1.toRaw(key);
            fx_1.Fx.track(target, key);
            return target.has(key);
        },
        add(value) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            value = reactive_1.toRaw(value);
            const target = reactive_1.toRaw(this);
            const hadKey = target.has(value);
            const res = target.add(value);
            if (!hadKey) {
                fx_1.Fx.trigger(target, fx_1.TriggerOpTypes.ADD, value);
            }
            return res;
        },
        set(key, value) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            value = reactive_1.toRaw(value);
            key = reactive_1.toRaw(key);
            const target = reactive_1.toRaw(this);
            const hadKey = target.has(key);
            const res = target.set(key, value);
            const oldValue = target.get(key);
            if (!hadKey) {
                fx_1.Fx.trigger(target, fx_1.TriggerOpTypes.ADD, key);
            }
            else if (value !== oldValue && (value === value || oldValue === oldValue)) {
                fx_1.Fx.trigger(target, fx_1.TriggerOpTypes.SET, key);
            }
            return res;
        },
        delete(key) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            key = reactive_1.toRaw(key);
            const target = reactive_1.toRaw(this);
            const hadKey = target.has(key);
            const res = target.delete(key);
            if (hadKey) {
                fx_1.Fx.trigger(target, fx_1.TriggerOpTypes.DELETE, key);
            }
            return res;
        },
        clear() {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            const target = reactive_1.toRaw(this);
            const hadItems = target.size != 0;
            const res = target.clear();
            if (hadItems) {
                fx_1.Fx.trigger(target, fx_1.TriggerOpTypes.CLEAR);
            }
            return res;
        },
        forEach(callbackfn, thisArg) {
            const target = reactive_1.toRaw(this);
            const callback = (value, key) => callbackfn.call(this, reactive_1.toReactive(value), reactive_1.toReactive(key), this);
            fx_1.Fx.track(target, fx_1.ITERATE_KEY);
            return target.forEach(callback, thisArg);
        },
    };
    return {
        get(target, key) {
            // used for reactive unwrapping & detection
            if (key === exports.REACTIVE_KEY)
                return target;
            const hasKey = methods.hasOwnProperty(key) && key in target;
            return (hasKey ? methods : target)[key];
        }
    };
}
exports.collectionHandlers = collectionHandlers;
//# sourceMappingURL=proxyHandlers.js.map