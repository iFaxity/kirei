declare type StopWatcher = () => void;
/**
 * Creates a function that runs anytime a reactive dependency updates.
 * @param {function} target - Target watchers function
 * @returns {void}
 */
export declare function watchFx(target: () => void): StopWatcher;
export {};
//# sourceMappingURL=watch.d.ts.map