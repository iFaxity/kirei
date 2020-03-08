import { Fx, activeFx, ITERATE_KEY, TriggerOpTypes } from './fx';
import { isObject, isFunction, isCollection, isObservable, mapObject } from './shared';

type MapCollection = Map<object, object> | WeakMap<object, object>;
type SetCollection = Set<object> | WeakSet<object>;
type Collection = Set<object> | Map<object, object>;
type AnyCollection = MapCollection | SetCollection;

export interface FxRef<T = any> {
  value: T;
}

type StopEffect = () => void;
type Computed<T> = () => T;
interface ComputedOptions<T> {
  get(): T;
  set(newValue: T): void;
}

const REF_KEY = Symbol('ref');
const reactiveMap: WeakMap<any, any> = new WeakMap();

export function toReactive<T>(obj: T): T;
export function toReactive<T extends object>(obj: T): T {
  return isObject(obj) ? reactive(obj) : obj;
}

function createRef<T>(obj: FxRef<T>): FxRef<T> {
  return (obj[REF_KEY] = true) && obj as FxRef<T>;
}

function baseHandlers<T extends object>(immutable: boolean): ProxyHandler<T> {
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
      } else if (newValue !== oldValue && (newValue === newValue || oldValue === oldValue)) {
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
  }
}

function collectionHandlers<T extends object>(immutable: boolean): ProxyHandler<T> {
  const methods = {
    get(key) {
      const target = toRaw(this) as MapCollection;
      key = toRaw(key);

      Fx.track(target, key);
      return toReactive(target.get(key));
    },
    get size() {
      const target = toRaw(this) as Map<object, object> | Set<object>;

      Fx.track(target, ITERATE_KEY);
      return target.size;
    },
    has(key) {
      const target = toRaw(this) as AnyCollection;
      key = toRaw(key);

      Fx.track(target, key);
      return target.has(key);
    },
    add(value) {
      if (immutable) {
        throw new TypeError('Collection is readonly');
      }

      value = toRaw(value)
      const target = toRaw(this) as SetCollection;
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
      const target = toRaw(this) as MapCollection;
      const hadKey = target.has(key);
      const res = target.set(key, value);
      const oldValue = target.get(key);

      if (!hadKey) {
        Fx.trigger(target, TriggerOpTypes.ADD, key);
      } else if (value !== oldValue && (value === value || oldValue === oldValue)) {
        Fx.trigger(target, TriggerOpTypes.SET, key);
      }
      return res;
    },
    delete(key) {
      if (immutable) {
        throw new TypeError('Collection is readonly');
      }

      key = toRaw(key);
      const target = toRaw(this) as Collection;
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

      const target = toRaw(this) as Collection;
      const hadItems = target.size != 0;
      const res = target.clear();

      if (hadItems) {
        Fx.trigger(target, TriggerOpTypes.CLEAR);
      }
      return res;
    },
    forEach(callbackfn, thisArg: ProxyConstructor) {
      const target = toRaw(this) as Collection;
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
  }
}

/**
 * Checks if an object is a reactive ref
 * @param {*} obj
 *
 * @return {boolean}
 */
export function isRef(obj: any): boolean {
  return obj != null && !!obj[REF_KEY];
}

/**
 * Checks if an object is a reactive object
 * @param {*} target
 *
 * @return {boolean}
 */
export function isReactive(target: any): boolean {
  return reactiveMap.has(target);
}

/**
 * Converts a reactive to it's raw object
 * @param {object} target
 *
 * @return {object}
 */
export function toRaw<T>(target: T): T {
  return reactiveMap.get(target) ?? target;
}

/**
 * Gets a ref or reactive as raw value
 * @param {*} obj - value to convert
 *
 * @return {*}
 */
export function toRawValue(obj: unknown): unknown {
  return isRef(obj) ? (obj as FxRef).value : toRaw(obj);
}

/**
 * Creates a ref object from a reactive prop
 * @param {object} target
 * @param {key} string
 *
 * @return {object}
 */
export function toRef<T extends object>(target: object, key: string): FxRef<T> {
  return createRef<T>({
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
export function toRefs<T extends object>(target: T): Record<string, FxRef<T>> {
  return mapObject((key) => [ key, toRef<T>(target, key)], target);
}


/**
 * Creates a reactive ref of a native value
 * @param {null|undefined|number|string|boolean} target
 *
 * @return {object}
 */
export function ref<T>(target: T): FxRef<T> {
  if (isRef(target)) return target as unknown as FxRef<T>;

  // if target is object create proxy for it
  let value = toReactive(target);

  const r: FxRef<T> = {
    get value(): T {
      Fx.track(r, 'value');
      return value;
    },
    set value(newValue: T) {
      value = toReactive(newValue) as T;
      Fx.trigger(r, TriggerOpTypes.SET, 'value');
    },
  };

  return createRef<T>(r);
}

/**
 * Creates a computed getter (and setter)
 * @param {function|object} target - function if getter only or object with get and set as functions.
 *
 * @return {object}
 */
export function computed<T>(target: ComputedOptions<T> | Computed<T>): FxRef<T> {
  let setter: (newValue: T) => void;
  let getter: () => T;

  if (isFunction(target)) {
    getter = target as () => T;
    setter = () => {};
  } else if (isObject(target)) {
    const obj = (target as object) as ComputedOptions<T>;

    getter = obj.get;
    setter = obj.set;
  } else {
    throw new TypeError('');
  }

  let value: T;
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
export function reactive<T extends object>(target: T): T {
  let res: T = reactiveMap.get(target);

  if (!res) {
    let handlers: ProxyHandler<T>;

    if (isCollection(target)) {
      handlers = collectionHandlers(false);
    } else if (isObservable(target)) {
      handlers = baseHandlers(false);
    } else {
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
export function readonly<T extends object>(target: T): T {
  let res: T = reactiveMap.get(target);

  if (!res) {
    let handlers: ProxyHandler<T>;

    if (isCollection(target)) {
      handlers = collectionHandlers(true);
    } else if (isObservable(target)) {
      handlers = baseHandlers(true);
    } else {
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
