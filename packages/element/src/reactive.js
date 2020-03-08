import { Fx, activeFx, ITERATE_KEY, TriggerOpTypes } from './fx';
import { isObject, isFunction, isCollection, isObservable, mapObject } from './shared';
const REF_KEY = Symbol('ref');
const reactiveMap = new WeakMap();
export function toReactive(obj) {
    return isObject(obj) ? reactive(obj) : obj;
}
function createRef(obj) {
    return (obj[REF_KEY] = true) && obj;
}
function baseHandlers(immutable) {
    return {
        get(target, key) {
            const res = target[key];
            if (isRef(res)) {
                return res.value;
            }
            Fx.track(target, key);
            return isObject(res) ? (immutable ? readonly(res) : reactive(res)) : res;
        },
        set(target, key, newValue) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            const oldValue = target[key];
            newValue = toRaw(newValue);
            if (isRef(oldValue) && !isRef(newValue)) {
                oldValue.value = newValue;
                return true;
            }
            const added = !target.hasOwnProperty(key);
            target[key] = newValue;
            // Key didnt exist before, add it
            if (added) {
                Fx.trigger(target, TriggerOpTypes.ADD, key);
            }
            else if (newValue !== oldValue && (newValue === newValue || oldValue === oldValue)) {
                Fx.trigger(target, TriggerOpTypes.SET, key);
            }
            return true;
        },
        deleteProperty(target, key) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            const res = delete target[key];
            if (res && target.hasOwnProperty(key)) {
                Fx.trigger(target, TriggerOpTypes.DELETE, key);
            }
            return res;
        },
        has(target, key) {
            Fx.track(target, key);
            return key in target;
        },
        ownKeys(target) {
            Fx.track(target, ITERATE_KEY);
            return Reflect.ownKeys(target);
        },
    };
}
function collectionHandlers(immutable) {
    const methods = {
        get(key) {
            const target = toRaw(this);
            key = toRaw(key);
            Fx.track(target, key);
            return toReactive(target.get(key));
        },
        get size() {
            const target = toRaw(this);
            Fx.track(target, ITERATE_KEY);
            return target.size;
        },
        has(key) {
            const target = toRaw(this);
            key = toRaw(key);
            Fx.track(target, key);
            return target.has(key);
        },
        add(value) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            value = toRaw(value);
            const target = toRaw(this);
            const hadKey = target.has(value);
            const res = target.add(value);
            if (!hadKey) {
                Fx.trigger(target, TriggerOpTypes.ADD, value);
            }
            return res;
        },
        set(key, value) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            value = toRaw(value);
            key = toRaw(key);
            const target = toRaw(this);
            const hadKey = target.has(key);
            const res = target.set(key, value);
            const oldValue = target.get(key);
            if (!hadKey) {
                Fx.trigger(target, TriggerOpTypes.ADD, key);
            }
            else if (value !== oldValue && (value === value || oldValue === oldValue)) {
                Fx.trigger(target, TriggerOpTypes.SET, key);
            }
            return res;
        },
        delete(key) {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            key = toRaw(key);
            const target = toRaw(this);
            const hadKey = target.has(key);
            const res = target.delete(key);
            if (hadKey) {
                Fx.trigger(target, TriggerOpTypes.DELETE, key);
            }
            return res;
        },
        clear() {
            if (immutable) {
                throw new TypeError('Collection is readonly');
            }
            const target = toRaw(this);
            const hadItems = target.size != 0;
            const res = target.clear();
            if (hadItems) {
                Fx.trigger(target, TriggerOpTypes.CLEAR);
            }
            return res;
        },
        forEach(callbackfn, thisArg) {
            const target = toRaw(this);
            const callback = (value, key) => callbackfn.call(this, toReactive(value), toReactive(key), this);
            Fx.track(target, ITERATE_KEY);
            return target.forEach(callback, thisArg);
        },
    };
    return {
        get(target, key) {
            const hasKey = methods.hasOwnProperty(key) && key in target;
            return (hasKey ? methods : target)[key];
        }
    };
}
/**
 * Checks if an object is a reactive ref
 * @param {*} obj
 *
 * @return {boolean}
 */
export function isRef(obj) {
    return obj != null && !!obj[REF_KEY];
}
/**
 * Checks if an object is a reactive object
 * @param {*} target
 *
 * @return {boolean}
 */
export function isReactive(target) {
    return reactiveMap.has(target);
}
/**
 * Converts a reactive to it's raw object
 * @param {object} target
 *
 * @return {object}
 */
export function toRaw(target) {
    var _a;
    return (_a = reactiveMap.get(target)) !== null && _a !== void 0 ? _a : target;
}
/**
 * Gets a ref or reactive as raw value
 * @param {*} obj - value to convert
 *
 * @return {*}
 */
export function toRawValue(obj) {
    return isRef(obj) ? obj.value : toRaw(obj);
}
/**
 * Creates a ref object from a reactive prop
 * @param {object} target
 * @param {key} string
 *
 * @return {object}
 */
export function toRef(target, key) {
    return createRef({
        get value() { return target[key]; },
        set value(newValue) { target[key] = newValue; }
    });
}
/**
 * Converts a reactive into refs.
 * @param {Proxy} target
 *
 * @return {object} of refs
 */
export function toRefs(target) {
    return mapObject((key) => [key, toRef(target, key)], target);
}
/**
 * Creates a reactive ref of a native value
 * @param {null|undefined|number|string|boolean} target
 *
 * @return {object}
 */
export function ref(target) {
    if (isRef(target))
        return target;
    // if target is object create proxy for it
    let value = toReactive(target);
    const r = {
        get value() {
            Fx.track(r, 'value');
            return value;
        },
        set value(newValue) {
            value = toReactive(newValue);
            Fx.trigger(r, TriggerOpTypes.SET, 'value');
        },
    };
    return createRef(r);
}
/**
 * Creates a computed getter (and setter)
 * @param {function|object} target - function if getter only or object with get and set as functions.
 *
 * @return {object}
 */
export function computed(target) {
    let setter;
    let getter;
    if (isFunction(target)) {
        getter = target;
        setter = () => { };
    }
    else if (isObject(target)) {
        const obj = target;
        getter = obj.get;
        setter = obj.set;
    }
    else {
        throw new TypeError('');
    }
    let value;
    let dirty = true;
    const fx = new Fx(getter, {
        lazy: true,
        computed: true,
        scheduler: () => { dirty = true; },
    });
    return createRef({
        get value() {
            if (dirty) {
                value = fx.run();
                dirty = false;
            }
            // Add child dependents to activeFx object
            if (activeFx != null) {
                for (const dep of fx.deps) {
                    if (!dep.has(activeFx)) {
                        dep.add(activeFx);
                        activeFx.deps.push(dep);
                    }
                }
            }
            return value;
        },
        set value(newValue) {
            setter(newValue);
        },
    });
}
/**
 * Creates a reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 *
 * @return {Proxy}
 */
export function reactive(target) {
    let res = reactiveMap.get(target);
    if (!res) {
        let handlers;
        if (isCollection(target)) {
            handlers = collectionHandlers(false);
        }
        else if (isObservable(target)) {
            handlers = baseHandlers(false);
        }
        else {
            throw new TypeError('target is not observable');
        }
        res = new Proxy(target, handlers);
    }
    return res;
}
/**
 * Creates a readonly reactive object that updates when a prop changes
 * @param {object} target - Object with own properties
 *
 * @return {Proxy}
 */
export function readonly(target) {
    let res = reactiveMap.get(target);
    if (!res) {
        let handlers;
        if (isCollection(target)) {
            handlers = collectionHandlers(true);
        }
        else if (isObservable(target)) {
            handlers = baseHandlers(true);
        }
        else {
            throw new TypeError('target is not observable');
        }
        res = new Proxy(target, handlers);
    }
    return res;
}
/**
 * Creates a watcher that runs anytime a reactive value changes
 * @param {function} target
 *
 * @return {void}
 *
export function watchEffect(target: Function): StopEffect {
  if (!isFunction(target)) {
    throw new TypeError('watch can an only watch functions');
  }

  const fx = new Fx(target, { lazy: false, computed: false });
  return fx.stop.bind(fx);
}

interface WatcherOptions {
  immediate?: boolean;
  deep?: boolean;
}
type WatchTarget<T> = FxRef<T> | (() => T);
export function watch<T>(
  target: WatchTarget<T>,
  fn: (values: any[], oldValues: any[]) => void,
  options: WatcherOptions
): void {
  let targetFn: () => T;
  if (isRef(target)) {
    targetFn = () => (target as FxRef<T>).value;
  } else {
    targetFn = target as () => T;
  }

  const fx = new Fx(() => {
    fn();
  }, { lazy: !options.immediate, computed: false });
  return fx.stop.bind(fx);
}*/
//# sourceMappingURL=reactive.js.map