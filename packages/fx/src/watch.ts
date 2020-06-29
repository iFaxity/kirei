import { isFunction } from '@kirei/shared';
import { Fx } from './fx';
//import { Ref, isRef } from './ref';

type StopWatcher = () => void;
/* TODO: not ready
interface WatcherOptions {
  immediate?: boolean;
  deep?: boolean;
}
type WatchTarget<T = any> = Ref<T> | (() => T);
type InferWatchValues<T> = {
  [K in keyof T]: T[K] extends WatchTarget<infer V> ? V : never;
}*/

/**
 * Creates a function that runs anytime a reactive dependency updates.
 * @param {function} target - Target watchers function
 * @returns {void}
 */
export function watchEffect(target: () => void): StopWatcher {
  if (!isFunction(target)) {
    throw new TypeError('watchFx can an only watch functions');
  }

  const fx = new Fx(target, { lazy: false, computed: false });
  return fx.stop.bind(fx);
}

/* TODO: not ready
export function watch<T extends WatchTarget[]>(
  target: T,
  callback: (values: InferWatchValues<T>, oldValues: InferWatchValues<T>) => void,
  options?: WatcherOptions
): void;
export function watch<T>(
  target: WatchTarget<T>,
  callback: (value: T, oldValue: T) => void,
  options?: WatcherOptions
): void {
  let fn: () => T|T[];

  if (Array.isArray(target)) {
    fn = () => target.map(x => isRef(x) ? x.value : x());
  } else if (isRef(target)) {
    fn = () => target.value;
  } else {
    fn = target;
  }

  const fx = new Fx(fn, {
    lazy: !options.immediate,
    computed: false,
  });
  return fx.stop.bind(fx);
}*/
