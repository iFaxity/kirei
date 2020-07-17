/*!
 * Based on https://github.com/vuejs/vue-next/blob/master/packages/reactivity
 * Copyright(c) 2019-2020 Vuejs Maintainers, http://vuejs.org
 * Copyright(c) 2020 Christian Norrman
 * MIT Licensed
 */
import { isUndefined } from '@kirei/shared';

const targetMap = new WeakMap<object, Map<any, Set<Fx>>>();
export enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear',
}

export const ITER_KEY = Symbol('iter');
export const MAP_KEY_ITER_KEY = Symbol('map_key_iter');
export const fxStack: Fx[] = [];
export let activeFx: Fx = null;
let tracking = true;
export const trackStack: boolean[] = [];

export interface FxOptions {
  lazy?: boolean;
  computed?: boolean;
  scheduler?(fn: Function): void;
}

export class Fx {
  readonly scheduler?: (fn: Function) => void;
  readonly raw: Function;
  active: boolean = true;
  deps: Set<Fx>[] = [];

  /**
   * Creates a new Fx instance, runs function when a reactive dependents value changes
   * @param {Function|Fx} target - Runner function
   * @param {object} options - Options for the fx
   */
  constructor(target: Function|Fx, options?: FxOptions) {
    const { lazy, scheduler } = options ?? {};
    this.scheduler = scheduler;
    this.raw = target instanceof Fx ? target.raw : target;
    this.run = this.run.bind(this);
    if (!lazy) {
      this.run();
    }
  }

  /**
   * Pauses tracking of fx's
   * @returns {void}
   */
  static pauseTracking(): void {
    trackStack.push(tracking);
    tracking = false;
  }

  /**
   * Resumes tracking of fx's
   * @returns {void}
   */
  static resumeTracking(): void {
    trackStack.push(tracking);
    tracking = true;
  }

  /**
   * Resets tracking to previous state
   * @returns {void}
   */
  static resetTracking(): void {
    tracking = trackStack.pop() ?? true;
  }

  /**
   * Tracks a reactive objects property for updates
   * @param {object|Proxy} target - Reactive object to anchor
   * @param {string|symbol} key - Property to track
   * @returns {void}
   */
  static track(target: object, key: string|symbol|number): void {
    if (!activeFx) {
      return;
    }

    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = new Map());
    }

    let deps = depsMap.get(key);
    if (!deps) {
      depsMap.set(key, deps = new Set());
    }

    if (!deps.has(activeFx)) {
      deps.add(activeFx);
      activeFx.deps.push(deps);
    }
  }

  /**
   * Triggers a change in a reactive object
   * @param {object|Proxy} target - Reactive object to anchor
   * @param {string} type - Trigger action type
   * @param {string|symbol} key - Property to trigger change on
   * @returns {void}
   */
  static trigger(target: object, type: string, key?: string|symbol|number, newValue?: unknown): void {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }

    const fxs = new Set<Fx>();
    function add(deps: Set<Fx>): void {
      if (deps && tracking) {
        deps.forEach(fx => fx !== activeFx && fxs.add(fx));
      }
    }

    if (type === TriggerOpTypes.CLEAR) {
      // collection being cleared
      // trigger all effects for target
      depsMap.forEach(add);
    } else if (key == 'length' && Array.isArray(target)) {
      depsMap.forEach((dep, key) => (key == 'length' || key >= newValue) && add(dep));
    } else {
      // schedule runs for SET | ADD | DELETE
      if (!isUndefined(key)) {
        add(depsMap.get(key));
      }

      // also run for iteration key on ADD | DELETE | Map.SET
      const isAddOrDelete =
        type === TriggerOpTypes.ADD ||
        (type === TriggerOpTypes.DELETE && !Array.isArray(target));

      if (isAddOrDelete || (type === TriggerOpTypes.SET && target instanceof Map)) {
        add(depsMap.get(Array.isArray(target) ? 'length' : ITER_KEY));
      }
      if (isAddOrDelete && target instanceof Map) {
        add(depsMap.get(MAP_KEY_ITER_KEY));
      }
    }

    fxs.forEach(fx => fx.scheduleRun());
  }

  /**
   * Runs the runner function to track dependencies, may run other runners recursively
   * @param {array} args
   * @returns {*}
   */
  run<T>(...args: any[]): T {
    if (!this.active) {
      return this.raw(...args);
    }

    if (!fxStack.includes(this)) {
      try {
        this.cleanup();
        Fx.resumeTracking();

        fxStack.push(this);
        activeFx = this;
        return this.raw(...args);
      } finally {
        fxStack.pop();
        activeFx = fxStack[fxStack.length - 1];
      }
    }
  }

  /**
   * Releases this fx from dependents
   * @returns {void}
   */
  cleanup(): void {
    const { deps } = this;
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        deps[i].delete(this);
      }

      this.deps = [];
    }
  }

  /**
   * Schedules a run of the runner function
   * @return {void}
   */
  scheduleRun(): void {
    if (this.scheduler) {
      this.scheduler(this.run);
    } else {
      this.run();
    }
  }

  /**
   * Marks fx as inactive and removes itself from the deps
   * @return {void}
   */
  stop(): void {
    if (this.active) {
      this.cleanup();
      this.active = false;
    }
  }
}
