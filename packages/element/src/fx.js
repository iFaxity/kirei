const targetMap = new WeakMap();
export var TriggerOpTypes;
(function (TriggerOpTypes) {
    TriggerOpTypes["SET"] = "set";
    TriggerOpTypes["ADD"] = "add";
    TriggerOpTypes["DELETE"] = "delete";
    TriggerOpTypes["CLEAR"] = "clear";
})(TriggerOpTypes || (TriggerOpTypes = {}));
export const ITERATE_KEY = Symbol('iterate');
export const fxStack = [];
export let activeFx = null;
export class Fx {
    /**
     * Creates a new Fx instance, runs function when a reactive dependents value changes
     * @param {function} target - Runner function
     * @param {object} options - Options for the fx
     *
     * @return {Fx}
     */
    constructor(target, options = {}) {
        this.active = true;
        this.deps = [];
        this.options = options;
        this.raw = Fx.isFx(target) ? target.raw : target;
        if (!options.lazy) {
            this.run();
        }
    }
    /**
     * Checks if an object is an Fx instance
     * @param {*} obj
     *
     * @return {boolean}
     */
    static isFx(obj) {
        return obj instanceof Fx;
    }
    /**
     * Tracks a reactive objects property for updates
     * @param {object|Proxy} target - Reactive object to anchor
     * @param {string|symbol} key - Property to track
     *
     * @return {void}
     */
    static track(target, key) {
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
     *
     * @return {void}
     */
    static trigger(target, type, key) {
        const depsMap = targetMap.get(target);
        // No dependents of target
        if (!depsMap)
            return;
        const fxs = new Set();
        const computedFxs = new Set();
        const addRunners = (deps) => {
            deps && deps.forEach(fx => (fx.options.computed ? computedFxs : fxs).add(fx));
        };
        if (type == TriggerOpTypes.CLEAR) {
            // collection being cleared, trigger all fxs for target
            depsMap.forEach(addRunners);
        }
        else {
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
     *
     * @return {void}
     */
    run(...args) {
        if (!this.active) {
            return this.raw(...args);
        }
        if (!fxStack.includes(this)) {
            this.cleanup();
            try {
                fxStack.push(this);
                activeFx = this;
                return this.raw(...args);
            }
            finally {
                fxStack.pop();
                activeFx = fxStack[fxStack.length - 1];
            }
        }
    }
    /**
     * Releases this fx from dependents
     */
    cleanup() {
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
    scheduleRun() {
        if (this.options.scheduler) {
            this.options.scheduler(this.run);
        }
        else {
            this.run();
        }
    }
    /**
     * Marks fx as inactive and removes itself from the deps
     *
     * @return {void}
     */
    stop() {
        if (this.active) {
            this.cleanup();
            this.active = false;
        }
    }
}
//# sourceMappingURL=fx.js.map