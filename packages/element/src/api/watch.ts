/*!
 * Based on https://github.com/vuejs/vue-next/blob/master/packages/runtime-core/src/apiWatch.ts
 * Copyright(c) 2019-2020 Vuejs Maintainers, http://vuejs.org
 * Copyright(c) 2020 Christian Norrman
 * MIT Licensed
 */
import { isFunction, isObject } from '@kirei/shared';
import { stop, effect, isRef, isReactive } from '@vue/reactivity';
import type { Ref } from '@vue/reactivity';
import { isMap, isSet } from '@vue/shared';

/**
 * Function to stop a reactive watcher
 */
type StopWatcher = () => void;

/**
 */
type WatchTarget<T = any> = Ref<T> | T | (() => T);

/**
 * Infers value types from an array of WatchTargets
 */
type InferWatchValues<T> = {
  [K in keyof T]: T[K] extends WatchTarget<infer V> ? V : never;
}


/**
 * Optional configuration to pass to a watcher
 */
interface WatchOptions {
  /**
   * If watcher should be run immediately, with undefined value(s)
   */
  immediate?: boolean;
  /**
   * If watch should traverse every child of the watched target(s)
   */
  deep?: boolean;
}

/**
 * Creates a function that runs anytime a reactive dependency updates.
 * Runs immediately to collect dependencies.
 * Returns a function to effectivly stop the watcher.
 * @param target - Function to run when an update is triggered
 * @returns A function to stop the effect from watching
 */
export function watchEffect(target: () => void): StopWatcher {
  if (!isFunction(target)) {
    throw new TypeError(`watchEffect expected function as argument, got ${typeof target}.`);
  }

  const fx = effect(target, { lazy: false });
  return stop.bind(null, fx);
}

/**
 * Watches one or multiple sources for changes, to easily consume the updates with a before and after value.
 * Has an option to trigger an immediate call (with oldValue set to undefined or empty array).
 * Returns a function to effectivly stop the watcher.
 * @param target - Target or targets to watch
 * @param callback - Callback to run when a target is updated
 * @param options - Optional watcher options
 * @returns A function to stop the effect from watching
 */
export function watch<T extends WatchTarget[]>(
  target: T,
  callback: (values: InferWatchValues<T>, oldValues: InferWatchValues<T>) => void,
  options?: WatchOptions
): StopWatcher;
export function watch<T extends WatchTarget>(
  target: WatchTarget<T>,
  callback: (values: T, oldValues: T) => void,
  options?: WatchOptions
): StopWatcher;
export function watch<T>(
  target: WatchTarget<T>|WatchTarget<T>[],
  callback: (value: T, oldValue: T) => void,
  options?: WatchOptions
): StopWatcher {
  let fn: () => T|T[];
  let value: T|T[];
  let deep = !!options.deep;

  if (!isFunction(callback)) {
    throw new TypeError(`Unexpected type in "callback", expected function got ${typeof callback}`);
  }

  if (Array.isArray(target)) {
    fn = () => target.map(t => {
      if (isRef(t)) {
        return t.value;
      } else if (isFunction(t)) {
        return t();
      } else if (isReactive(t)) {
        return traverse(t);
      }

      throw new TypeError(`Unexpected type, cannot watch ${typeof target}`);
    });
    value = [];
  } else if (isRef(target)) {
    fn = () => target.value;
  } else if (isFunction(target)) {
    fn = target;
  } else if (isReactive(target)) {
    fn = () => target;
    deep = true;
  } else {
    throw new TypeError(`Unexpected type, cannot watch ${typeof target}`);
  }

  if (deep && callback) {
    const getter = fn;
    fn = () => traverse(getter());
  }

  const { immediate } = options ?? {};
  const fx = effect(fn, {
    lazy: true,
    scheduler(run) {
      const newValue = run();

      callback(newValue as T, value as T);
      value = newValue;
    }
  });

  // If immediate, run scheduler, otherwise cache value(s) for next run.
  if (immediate) {
    fx.options.scheduler(fx);
  } else {
    value = fx();
  }
  return stop.bind(null, fx);
}

/**
 * Traverses every property of the value
 * @param value - Value to traverse
 * @param seen - List of values that has already been traversed
 * @returns The same object as the input value
 */
function traverse<T = any>(value: T, seen: Set<unknown> = new Set()): T {
  if (!isObject(value) || seen.has(value)) {
    return value;
  }
  seen.add(value);

  if (isRef(value)) {
    traverse(value.value, seen);
  } else if (Array.isArray(value) || isSet(value) || isMap(value)) {
    value.forEach(v => traverse(v, seen));
  } else {
    for (const key in value) {
      traverse(value[key], seen);
    }
  }

  return value;
}
