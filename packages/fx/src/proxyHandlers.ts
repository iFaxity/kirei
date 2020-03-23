import { isObject } from '@shlim/shared';
import { Fx, ITERATE_KEY, TriggerOpTypes } from './fx';
import { isRef } from './ref';
import { toRaw, toReactive, reactive, readonly } from './reactive';
import { MapCollection, SetCollection, AnyCollection, Collection } from './shared';

const arrayShims = [ 'indexOf', 'lastIndexOf', 'includes' ];

/**
 * Shim for array search functions: indexOf, lastIndexOf and includes
 * @param {*} target Reactive target
 * @param {string} key Array function key
 * @param {*} receiver Target array
 * @returns {Function}
 */
function arraySearchShim(target: any, key: string): (...args: any[]) => any {
  return (...args) => {
    const self = toRaw(target);
    const len = self.length;

    // Track all indicies for this effect
    for (let i = 0; i < len; i++) {
      Fx.track(self, i + '');
    }

    // Args may be reactive, but we try first anyway
    const res = self[key](...args);

    // If res was negative, re-run it again with raw arguments
    if (res === -1 || res === false) {
      return self[key](...args.map(toRaw));
    }
    return res;
  };
}

/**
 * Proxy handlers for reactive objects and arrays
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 */
export function baseHandlers<T extends object>(immutable: boolean): ProxyHandler<T> {
  return {
    get(target, key, receiver) {
      const isArray = Array.isArray(target);

      if (isArray && arrayShims.includes(key as string)) {
        return arraySearchShim(receiver, key as string);
      }

      const res = target[key];
      if (isRef(res) && !isArray) {
        return res.value;
      }

      Fx.track(target, key);
      return isObject(res) ? (immutable ? readonly(res) : reactive(res)) : res;
    },
    set(target, key, newValue, receiver) {
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
      const res = Reflect.set(target, key, newValue);

      // Only trigger change it target and receiver matches
      if (target === toRaw(receiver)) {
        if (added) {
          Fx.trigger(target, TriggerOpTypes.ADD, key);
        } else if (newValue !== oldValue && (newValue === newValue || oldValue === oldValue)) {
          Fx.trigger(target, TriggerOpTypes.SET, key);
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

/**
 * Proxy handlers for collection objects
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 */
export function collectionHandlers<T extends object>(immutable: boolean): ProxyHandler<T> {
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
  };
}
