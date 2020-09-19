/*!
 * Based on https://github.com/vuejs/vue-next/blob/master/packages/reactivity
 * Copyright(c) 2019-2020 Vuejs Maintainers, http://vuejs.org
 * Copyright(c) 2020 Christian Norrman
 * MIT Licensed
 */
import { isUndefined } from '@kirei/shared';


/**
 * Weak cache to track dependencies
 * @const {WeakMap<any, Map<string|symbol|number Set<Fx>>>}
 */
const targetMap = new WeakMap<any, Map<string|symbol|number, Set<Fx>>>();

/**
 * @enum
 * @private
 */
export enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear',
}

/**
 * Symbol to track list iteration
 * @const {symbol}
 * @private
 */
export const ITER_KEY = Symbol('iter');

/**
 * Symbol to track map iteration
 * @const {symbol}
 * @private
 */
export const MAP_KEY_ITER_KEY = Symbol('map_key_iter');

/**
 * Stack of active effects
 * @const {Fx[]}
 * @private
 */
export const activeStack: Fx[] = [];

/**
 * Stack to toggle tracking along a stack
 * @const {boolean[]}
 * @private
 */
export const trackStack: boolean[] = [];

/**
 * @var {Fx}
 * @private
 */
export let activeFx: Fx = null;
let tracking = true;

/**
 * @type
 */
type FxTarget<T> = (...args: any[]) => T;


/**
 * @type
 */
export interface FxOptions<T> {
  /**
   * If true does not automatically run on instansiation
   * @var {boolean}
   */
  lazy?: boolean;

  /**
   * Function to schedule a runners effect
   * @param {FxTarget<T>} runner
   * @returns {void}
   */
  scheduler?(runner: FxTarget<T>): void;
}

/**
 * @class
 */
export class Fx<T = unknown> {
  /**
   * Scheduling function
   * @var {Function}
   */
  readonly scheduler?: (runner: FxTarget<T>) => void;

  /**
   * Raw runner function
   * @var {FxTarget<T>}
   */
  readonly raw: FxTarget<T>;

  /**
   * If effect should be active
   * @var {boolean}
   */
  active: boolean = true;

  /**
   * List of tracked dependencies
   * @var {Set<Fx>[]}
   */
  deps: Set<Fx>[] = [];

  /**
   * Creates a new Fx instance, runs function when a reactive dependents value changes
   * @param {Function|Fx} target - Runner function
   * @param {object} options - Options for the fx
   */
  constructor(target: FxTarget<T>|Fx<T>, options?: FxOptions<T>) {
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
      // collection being cleared, trigger all effects for target
      depsMap.forEach(add);
    } else {
      const isArray = Array.isArray(target);

      if (key == 'length' && isArray) {
        // Add for each key in array
        depsMap.forEach((dep, key) => (key == 'length' || (key as number) >= newValue) && add(dep));
      } else {
        // schedule runs for SET | ADD | DELETE
        if (!isUndefined(key)) {
          add(depsMap.get(key));
        }

        if (target instanceof Map) {
          switch (type) {
            case TriggerOpTypes.ADD:
            case TriggerOpTypes.DELETE:
              add(depsMap.get(MAP_KEY_ITER_KEY));
              break;

            case TriggerOpTypes.SET:
              add(depsMap.get(ITER_KEY));
              break;
          }
        } else if (type === TriggerOpTypes.ADD || (!isArray && type === TriggerOpTypes.DELETE)) {
          add(depsMap.get(isArray ? 'length' : ITER_KEY));
        }
      }
    }

    fxs.forEach(fx => fx.scheduleRun());
  }

  /**
   * Runs the runner function to track dependencies, may run other runners recursively
   * @param {...any[]} args
   * @returns {*}
   */
  run(...args: any[]): T {
    if (!this.active) {
      return this.raw(...args);
    }

    if (!activeStack.includes(this)) {
      try {
        this.cleanup();
        Fx.resumeTracking();

        activeStack.push(this);
        activeFx = this;
        return this.raw(...args);
      } finally {
        activeStack.pop();
        activeFx = activeStack[activeStack.length - 1];
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
