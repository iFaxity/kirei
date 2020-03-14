
const targetMap = new WeakMap<object, Map<any, Set<Fx>>>();
export enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear',
}

export const ITERATE_KEY = Symbol('iterate');
export const fxStack: Fx[] = [];
export let activeFx: Fx = null;
let tracking = true;
const trackStack: boolean[] = [];

export interface FxOptions {
  lazy?: boolean;
  computed?: boolean;
  scheduler?: (fn: Function) => void;
}

export class Fx {
  active: boolean = true;
  options: FxOptions;
  deps: Set<Fx>[] = [];
  raw: Function;

  /**
   * Creates a new Fx instance, runs function when a reactive dependents value changes
   * @param {Function|Fx} target - Runner function
   * @param {object} options - Options for the fx
   */
  constructor(target: Function | Fx, options: FxOptions = {}) {
    this.options = options;
    this.raw = Fx.isFx(target) ? (target as Fx).raw : (target as Function);

    if (!options.lazy) {
      this.run();
    }
  }

  /**
   * Checks if an object is an Fx instance
   * @param {*} obj
   * @return {boolean}
   */
  static isFx(obj: unknown): obj is Fx {
    return obj instanceof Fx;
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
      depsMap = new Map();
      targetMap.set(target, depsMap);
    }

    let dep = depsMap.get(key);
    if (!dep) {
      dep = new Set();
      depsMap.set(key, dep);
    }

    if (!dep.has(activeFx)) {
      dep.add(activeFx);
      activeFx.deps.push(dep);
    }
  }

  /**
   * Triggers a change in a reactive object
   * @param {object|Proxy} target - Reactive object to anchor
   * @param {string} type - Trigger action type
   * @param {string|symbol} key - Property to trigger change on
   * @returns {void}
   */
  static trigger(target: object, type: string, key?: string|symbol|number): void {
    const depsMap = targetMap.get(target);

    // No dependents of target
    if (!depsMap) return;

    const fxs = new Set<Fx>();
    const computedFxs = new Set<Fx>();
    const addRunners = (deps: Set<Fx>): void => {
      if (deps && tracking) {
        deps.forEach(fx => {
          if (fx !== activeFx) {
            (fx.options.computed ? computedFxs : fxs).add(fx);
          }
        });
      }
    };

    if (type == TriggerOpTypes.CLEAR) {
      // collection being cleared, trigger all fxs for target
      depsMap.forEach(addRunners);
    } else {
      // schedule runs for SET | ADD | DELETE
      if (key) {
        addRunners(depsMap.get(key));
      }

      // also run for iteration key on ADD | DELETE
      if (type == TriggerOpTypes.ADD || type == TriggerOpTypes.DELETE) {
        const iterKey = Array.isArray(target) ? 'length' : ITERATE_KEY;
        addRunners(depsMap.get(iterKey));
      }
    }

    // Important: computed fx must be run first so that computed getters
    // can be invalidated before any normal fx that depend on them are run.
    computedFxs.forEach(fx => fx.scheduleRun());
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

      deps.length = 0;
    }
  }

  /**
   * Schedules a run of the runner function
   *
   * @return {void}
   */
  scheduleRun(): void {
    if (this.options.scheduler) {
      this.options.scheduler(this.run);
    } else {
      this.run();
    }
  }

  /**
   * Marks fx as inactive and removes itself from the deps
   *
   * @return {void}
   */
  stop(): void {
    if (this.active) {
      this.cleanup();
      this.active = false;
    }
  }
}
