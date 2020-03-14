import { Fx, activeFx, ITERATE_KEY, TriggerOpTypes } from './fx';
import {
  isObject,
  isFunction,
  isCollection,
  isObservable,
  mapObject,
  MapCollection,
  SetCollection,
  Collection,
  AnyCollection,
} from './shared';

export type FxRef<T = any> = { value: T; };

type StopEffect = () => void;
type Computed<T> = () => T;
interface ComputedOptions<T> {
  get(): T;
  set(newValue: T): void;
}

const REF_KEY = Symbol('ref');
const reactiveMap: WeakMap<any, any> = new WeakMap();

/**
 * Returns a reactive from an object, native values are unchanged.
 * @param {*} target Target to check
 * @returns {Proxy|*}
 */
export function toReactive<T>(target: T): T;
export function toReactive<T extends object>(target: T): T {
  return isObject(target) ? reactive(target) : target;
}

/**
 * Creates a ref object from an object with a getter & setter for value
 * @param {object} target Target to create a ref from
 * @returns {FxRef}
 */
function createRef<T>(target: object): FxRef<T> {
  return (target[REF_KEY] = true) && target as FxRef<T>;
}

/**
 * Proxy handlers for reactive objects and arrays
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 */
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

/**
 * Proxy handlers for collection objects
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 */
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
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isRef(target: any): target is FxRef {
  return target != null && REF_KEY in target;
}

/**
 * Checks if an object is a reactive object
 * @param {*} target Target to check
 * @returns {boolean}
 */
export function isReactive(target: any): boolean {
  return reactiveMap.has(target);
}

/**
 * Unpacks a reactive to it's raw form, otherwise returns target
 * @param {object} target Target to convert
 * @returns {object}
 */
export function toRaw<T>(target: T): T {
  return reactiveMap.get(target) ?? target;
}

/**
 * Unpacks a ref or reactive to it's raw value, otherwise returns target
 * @param {*} target - Target to unpack
 * @returns {*}
 */
export function toRawValue(target: unknown): unknown {
  return isRef(target) ? (target as FxRef).value : toRaw(target);
}

/**
 * Creates a ref wrapper from a property within a reactive object
 * @param {object} target
 * @param {key} string
 * @returns {FxRef}
 */
export function toRef<T extends object>(target: object, key: string): FxRef<T> {
  return createRef<T>({
    get value() { return target[key]; },
    set value(newValue) { target[key] = newValue; }
  });
}

/**
 * Creates ref wrappers for all properties within a reactive object
 * @param {Proxy} target
 *
 * @return {object} of refs
 */
export function toRefs<T extends object>(target: T): Record<string, FxRef<T>> {
  return mapObject((key) => [ key, toRef<T>(target, key)], target);
}


/**
 * Creates a reactive ref of a native value
 * Creates a ref
 * @param {null|undefined|number|string|boolean} target
 * @returns {FxRef}
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
 * Creates a computed getter (and setter) as a ref object
 * @param {Function|object} target - function if getter only or object with get and set as functions.
 * @returns {FxRef}
 */
export function computed<T>(target: ComputedOptions<T> | Computed<T>): FxRef<T> {
  let setter: (newValue: T) => void;
  let getter: () => T;

  if (isFunction(target)) {
    getter = target.bind(undefined);
    setter = () => {};
  } else if (isObject(target)) {
    const obj = (target as object) as ComputedOptions<T>;

    getter = obj.get.bind(undefined);
    setter = obj.set.bind(undefined);
  } else {
    throw new TypeError('Not a valid target');
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
 * @returns {Proxy}
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
 * Creates a immutable reactive object
 * @param {object} target - Object with own properties
 * @returns {Proxy}
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
 * Creates a function that runs anytime a reactive dependency updates.
 * @param {function} target - Target watchers function
 * @returns {void}
 */
export function watchEffect(target: Function): StopEffect {
  if (!isFunction(target)) {
    throw new TypeError('watch can an only watch functions');
  }

  const fx = new Fx(target, { lazy: false, computed: false });
  return fx.stop.bind(fx);
}

/*
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
