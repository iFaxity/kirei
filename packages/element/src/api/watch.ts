/*!
 * Based on https://github.com/vuejs/vue-next/blob/master/packages/runtime-core/src/apiWatch.ts
 * Copyright(c) 2019-2020 Vuejs Maintainers, http://vuejs.org
 * Copyright(c) 2020 Christian Norrman
 * MIT Licensed
 */
import { isFunction } from '@kirei/shared';
import { stop, effect, isRef } from '@vue/reactivity';
import type { Ref } from '@vue/reactivity';

/**
 * Function to stop a reactive watcher
 * @type
 */
type StopWatcher = () => void;

/**
 * @type
 */
type WatchTarget<T = any> = Ref<T> | (() => T);

/**
 * Infers value types from an array of WatchTargets
 * @type
 */
type InferWatchValues<T> = {
  [K in keyof T]: T[K] extends WatchTarget<infer V> ? V : never;
}


/**
 * Optional configuration to pass to a watcher
 * @interface
 */
interface WatchOptions {
  /**
   * If watcher should be run immediately, with undefined value(s)
   * @var {boolean}
   */
  immediate?: boolean;
  //deep?: boolean;
}

/**
 * Creates a function that runs anytime a reactive dependency updates.
 * Runs immediately to collect dependencies.
 * Returns a function to effectivly stop the watcher.
 * @param {Function} target Function to run when an update is triggered
 * @returns {StopEffect}
 */
export function watchEffect(target: () => void): StopWatcher {
  if (!isFunction(target)) {
    throw new TypeError(`watchEffect expected function as argument, got ${typeof target}.`);
  }

  const fx = effect(target, { lazy: false });
  return stop.bind(null, fx);
}


// TODO: add deep functionality, for reactive objects
/**
 * Watches one or multiple sources for changes, to easily consume the updates with a before and after value.
 * Has an option to trigger an immediate call (with oldValue set to undefined or empty array).
 * Returns a function to effectivly stop the watcher.
 * @param {WatchTarget<T>|WatchTarget[]} target Target or targets to watch
 * @param {Function} callback Callback to run when a target is updated
 * @param {WatchOptions} options Optional watcher options
 * @returns {StopWatcher}
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

  if (!isFunction(callback)) {
    throw new TypeError(`Unexpected type in "callback", expected function got ${typeof callback}`);
  }

  if (Array.isArray(target)) {
    fn = () => target.map(t => isRef(t) ? t.value : t());
    value = [];
  } else if (isRef(target)) {
    fn = () => target.value;
  } else if (isFunction(target)) {
    fn = target;
  } else {
    throw new TypeError(`Unexpected type, cannot watch ${typeof target}`);
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
