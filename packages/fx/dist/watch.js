"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
const fx_1 = require("./fx");
/**
 * Creates a function that runs anytime a reactive dependency updates.
 * @param {function} target - Target watchers function
 * @returns {void}
 */
function watchFx(target) {
    if (!shared_1.isFunction(target)) {
        throw new TypeError('watchFx can an only watch functions');
    }
    const fx = new fx_1.Fx(target, { lazy: false, computed: false });
    return fx.stop.bind(fx);
}
exports.watchFx = watchFx;
/*interface WatcherOptions {
  immediate?: boolean;
  deep?: boolean;
}
type WatchTarget<T = any> = Ref<T> | (() => T);
type InferWatchValues<T> = {
  [K in keyof T]: T[K] extends WatchTarget<infer V> ? V : never;
}

export function watch<T extends WatchTarget[]>(
  target: T,
  callback: (values: InferWatchValues<T>, oldValues: InferWatchValues<T>) => void,
  options: WatcherOptions
): void;
export function watch<T>(
  target: WatchTarget<T>,
  callback: (value: T, oldValue: T) => void,
  options: WatcherOptions
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
//# sourceMappingURL=watch.js.map