/*!
 * Based on https://github.com/vuejs/vue-next/blob/master/packages/reactivity
 * Copyright(c) 2019-2020 Vuejs Maintainers, http://vuejs.org
 * Copyright(c) 2020 Christian Norrman
 * MIT Licensed
 */
import { isFunction } from '@kirei/shared';
import { Fx } from './fx';
import { Ref, isRef } from './ref';

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
interface WatcherOptions {
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

  const fx = new Fx(target, { lazy: false });
  return fx.stop.bind(fx);
}

// TODO: not ready, requires more experimenting
// TODO: add deep functionality
// TODO: add functionality for reactive

/**
 * 
 * @param {WatchTarget<T>|WatchTarget[]} target Target or targets to watch
 * @param {Function} callback Callback to run when a target is updated
 * @param {WatcherOptions} options Optional watcher options
 * @returns {StopWatcher}
 */
export function watch<T extends WatchTarget[]>(
  target: T,
  callback: (values: InferWatchValues<T>, oldValues: InferWatchValues<T>) => void,
  options?: WatcherOptions
): StopWatcher;
export function watch<T>(
  target: WatchTarget<T>,
  callback: (values: T, oldValues: T) => void,
  options?: WatcherOptions
): StopWatcher;
export function watch<T>(
  target: WatchTarget<T>,
  callback: (value: T, oldValue: T) => void,
  options?: WatcherOptions
): StopWatcher {
  const immediate = !!options?.immediate;
  let fn: () => T|T[];
  let value: T|T[];

  if (Array.isArray(target)) {
    fn = () => target.map(x => isRef(x) ? x.value : x());
    value = [] as T[];
  } else if (isRef(target)) {
    fn = () => target.value;
  } else if (isFunction(target)) {
    fn = target;
  } else {
    throw new TypeError(`Unexpected type, cannot watch ${typeof target}`);
  }

  const fx = new Fx(fn, {
    lazy: true,
    scheduler(run) {
      const newValue = run();

      callback(newValue as T, value as T);
      value = newValue;
    }
  });

  // Immediate runs scheduler, otherwise cache values for next run.
  if (immediate) {
    fx.scheduleRun();
  } else {
    value = fx.run();
  }

  return fx.stop.bind(fx);
}

