import { isObject } from '@kirei/shared';
import { Fx, ITERATE_KEY, TriggerOpTypes } from './fx';
import { isRef } from './ref';
import { toRaw, toReactive, reactive, readonly } from './reactive';
import { MapCollection, SetCollection, AnyCollection, Collection } from './shared';

const arrayShims = [ 'indexOf', 'lastIndexOf', 'includes' ];
export const REACTIVE_KEY = Symbol('reactive');

/**
 * Shim for array search functions: indexOf, lastIndexOf and includes
 * @param {*} target Reactive target
 * @param {string} key Array function key
 * @param {*} receiver Target array
 * @returns {Function}
 */
function arraySearchShim(target: any[], key: string, ...args: any[]): (...args: any[]) => any {
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
 * Proxy handlers for reactive objects and arrays
 * @param {boolean} immutable Throw an error every time a property attempts a mutation
 * @returns {ProxyHandler}
 */
export function baseHandlers<T extends object>(immutable: boolean, target: T): ProxyHandler<T> {
  const isArray = Array.isArray(target);
  // TODO: add entries(), values(), keys() and Symbol.iterator for array
  return {
    get(_, key, receiver) {
      // used for reactive unwrapping & detection
      if (key === REACTIVE_KEY) return target;

      /*if (isArray) {
        if (key === Symbol.iterator) {}
      }*/
      if (isArray && arrayShims.includes(key as string)) {
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
      return isObject(res) ? (immutable ? readonly(res) : reactive(res)) : res;
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
          Fx.trigger(target, TriggerOpTypes.ADD, key);
        } else if (newValue !== oldValue && (newValue === newValue || oldValue === oldValue)) {
          Fx.trigger(target, TriggerOpTypes.SET, key);
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
export function collectionHandlers<T extends object>(immutable: boolean, target: T): ProxyHandler<T> {
  const methods = {
    get(key) {
      const self = target as MapCollection;
      key = toRaw(key);

      Fx.track(self, key);
      return toReactive(self.get(key));
    },
    get size() {
      const self = target as Collection;

      Fx.track(self, ITERATE_KEY);
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
        Fx.trigger(self, TriggerOpTypes.ADD, value);
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
        Fx.trigger(self, TriggerOpTypes.ADD, key);
      } else if (value !== oldValue && (value === value || oldValue === oldValue)) {
        Fx.trigger(self, TriggerOpTypes.SET, key);
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

      Fx.track(self, ITERATE_KEY);
      return self.forEach((value, key) => {
        value = isRef(value) ? value : toReactive(value);
        key = isRef(key) ? key : toReactive(key);
        return callbackfn.call(self, value, key, self);
      });
    },
  };

  //TODO: add entries(), values(), keys() and Symbol.iterator (both map and set)
  return {
    get(_, key) {
      // used for reactive unwrapping & detection
      if (key === REACTIVE_KEY) return target;
      const hasKey = methods.hasOwnProperty(key) && key in target;
      return (hasKey ? methods : target)[key];
    }
  };
}
