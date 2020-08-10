/*!
 * Based on https://github.com/vuejs/vue-next/blob/master/packages/reactivity
 * Copyright(c) 2019-2020 Vuejs Maintainers, http://vuejs.org
 * Copyright(c) 2020 Christian Norrman
 * MIT Licensed
 */
import { Fx, ITER_KEY, MAP_KEY_ITER_KEY, TriggerOpTypes } from './fx';
import { isRef } from './ref';
import { toRaw, toReactive, toReadonly } from './reactive';
import { MapCollection, SetCollection, AnyCollection, Collection } from './shared';

/**
 * @private
 */
const ARRAY_SHIMS = [ 'indexOf', 'lastIndexOf', 'includes' ];

/**
 * Symbol for identifying a reactive proxy
 * @private
 */
export const REACTIVE_KEY = Symbol('reactive');

/**
 * Symbol for identifying a readonly proxy
 * @private
 */
export const READONLY_KEY = Symbol('readonly');

/**
 * Symbol for identifying a observable proxy
 * @private
 */
export const OBSERVER_KEY = Symbol('observer');

/**
 * Shim for array search functions: indexOf, lastIndexOf and includes
 * @param {any[]} target Reactive target
 * @param {string} key Array function key
 * @param {any[]} args Optional arguments
 * @returns {Function}
 * @private
 */
function arraySearchShim(
  target: any[],
  key: string,
  ...args: any[]
): (...args: any[]) => any {
  const len = target.length;

  // Track all indicies for this fx
  for (let i = 0; i < len; i++) {
    Fx.track(target, i + '');
  }

  // Args may be reactive, but we try first anyway
  const res = target[key](...args);

  // If res was negative, re-run it again with raw arguments
  if (res === -1 || res === false) {
    return target[key](...args.map(toRaw));
  }
  return res;
}

/**
 * Shims a collections built-in iterator to observe updates
 * @param {AnyCollection} target Target collection
 * @param {string|symbol} method Method to shim
 * @param {boolean} immutable If collection is considered readonly
 * @returns {Generator}
 * @private
 */
function wrapCollectionIterator<T extends object>(
  target: T,
  method: string|symbol,
  immutable: boolean
): () => IterableIterator<any> {
  const isMap = target instanceof Map;
  const isPair = method == 'entries' || (isMap && method == Symbol.iterator);
  const isKeyOnly = isMap && method == 'keys';
  const wrap = immutable ? toReadonly : toReactive;

  return function*() {
    const iter = target[method]();
    Fx.track(
      target,
      isKeyOnly ? MAP_KEY_ITER_KEY : ITER_KEY
    );

    for (const item of iter) {
      yield isPair ? [wrap(item[0]), wrap(item[1])] : wrap(item);
    }
  };
}

/**
 * Proxy handlers for reactive objects and arrays
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 * @private
 */
export function baseHandlers<T extends object>(immutable: boolean, target: T): ProxyHandler<T> {
  const isArray = Array.isArray(target);
  const wrap = immutable ? toReadonly : toReactive;
  const symbol = immutable ? READONLY_KEY : REACTIVE_KEY;

  return {
    get(_, key, receiver) {
      // used for reactive unwrapping & detection
      if (key === symbol || key === OBSERVER_KEY) return target;
      if (isArray && ARRAY_SHIMS.includes(key as string)) {
        return arraySearchShim.bind(null, target, key);
      }

      const res = target[key];
      if (isRef(res)) {
        if (isArray) {
          Fx.track(target, key);
          return res;
        }

        return res.value;
      }

      Fx.track(target, key);
      return wrap(res);
    },
    set(_, key, newValue, receiver) {
      if (immutable) {
        throw new TypeError('Object is readonly');
      }

      const oldValue = target[key];

      newValue = toRaw(newValue);
      if (!isArray && isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue;
        return true;
      }

      const added = !target.hasOwnProperty(key);
      const res = Reflect.set(target, key, newValue);

      // Only trigger change if target and receiver matches
      if (target === toRaw(receiver)) {
        if (added) {
          Fx.trigger(target, TriggerOpTypes.ADD, key, newValue);
        } else if (newValue !== oldValue && (newValue === newValue || oldValue === oldValue)) {
          Fx.trigger(target, TriggerOpTypes.SET, key, newValue);
        }
      }

      return res;
    },
    deleteProperty(_, key) {
      if (immutable) {
        throw new TypeError('Object is readonly');
      }

      const res = delete target[key];
      if (res && target.hasOwnProperty(key)) {
        Fx.trigger(target, TriggerOpTypes.DELETE, key);
      }

      return res;
    },
    has(_, key) {
      Fx.track(target, key);
      return key in target;
    },
    ownKeys(_) {
      Fx.track(target, ITER_KEY);
      return Reflect.ownKeys(target);
    },
  };
}

/**
 * Proxy handlers for collection objects
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 * @private
 */
export function collectionHandlers<T extends object>(immutable: boolean, target: T): ProxyHandler<T> {
  const wrap = immutable ? toReadonly : toReactive;
  const symbol = immutable ? READONLY_KEY : REACTIVE_KEY;
  const methods = {
    get(key) {
      const self = target as MapCollection;
      key = toRaw(key);

      Fx.track(self, key);
      return wrap(self.get(key));
    },
    get size() {
      const self = target as Collection;

      Fx.track(self, ITER_KEY);
      return self.size;
    },
    has(key) {
      const self = target as AnyCollection;
      key = toRaw(key);

      Fx.track(self, key);
      return self.has(key);
    },
    add(value) {
      if (immutable) {
        throw new TypeError('Collection is readonly');
      }

      value = toRaw(value);
      const self = target as SetCollection;
      const hadKey = self.has(value);
      const res = self.add(value);

      if (!hadKey) {
        Fx.trigger(self, TriggerOpTypes.ADD, value, value);
      }
      return res;
    },
    set(key, value) {
      if (immutable) {
        throw new TypeError('Collection is readonly');
      }

      value = toRaw(value);
      key = toRaw(key);
      const self = target as MapCollection;
      const hadKey = self.has(key);
      const res = self.set(key, value);
      const oldValue = self.get(key);

      if (!hadKey) {
        Fx.trigger(self, TriggerOpTypes.ADD, key, value);
      } else if (value !== oldValue && (value === value || oldValue === oldValue)) {
        Fx.trigger(self, TriggerOpTypes.SET, key, value);
      }
      return res;
    },
    delete(key) {
      if (immutable) {
        throw new TypeError('Collection is readonly');
      }

      key = toRaw(key);
      const self = target as Collection;
      const hadKey = self.has(key);
      const res = self.delete(key);

      if (hadKey) {
        Fx.trigger(self, TriggerOpTypes.DELETE, key);
      }
      return res;
    },
    clear() {
      if (immutable) {
        throw new TypeError('Collection is readonly');
      }

      const self = target as Collection;
      const hadItems = self.size != 0;
      const res = self.clear();

      if (hadItems) {
        Fx.trigger(self, TriggerOpTypes.CLEAR);
      }
      return res;
    },
    forEach(callbackfn) {
      const self = target as Collection;

      Fx.track(self, ITER_KEY);
      return self.forEach((value, key) => {
        value = isRef(value) ? value : wrap(value);
        key = isRef(key) ? key : wrap(key);
        return callbackfn.call(self, value, key, self);
      });
    },
    // TODO: shim these
    [Symbol.iterator]: wrapCollectionIterator(target, Symbol.iterator, immutable),
    values: wrapCollectionIterator(target, 'values', immutable),
    keys: wrapCollectionIterator(target, 'keys', immutable),
    entries: wrapCollectionIterator(target, 'entries', immutable),
  };

  return {
    get(_, key) {
      // used for reactive unwrapping & detection
      if (key === symbol || key === OBSERVER_KEY) return target;
      const hasKey = methods.hasOwnProperty(key) && key in target;
      return (hasKey ? methods : target)[key];
    }
  };
}
