"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const targetMap = new WeakMap();
var TriggerOpTypes;
(function (TriggerOpTypes) {
    TriggerOpTypes["SET"] = "set";
    TriggerOpTypes["ADD"] = "add";
    TriggerOpTypes["DELETE"] = "delete";
    TriggerOpTypes["CLEAR"] = "clear";
})(TriggerOpTypes = exports.TriggerOpTypes || (exports.TriggerOpTypes = {}));
exports.ITERATE_KEY = Symbol('iterate');
exports.fxStack = [];
exports.activeFx = null;
let tracking = true;
const trackStack = [];
class Fx {
    /**
     * Creates a new Fx instance, runs function when a reactive dependents value changes
     * @param {Function|Fx} target - Runner function
     * @param {object} options - Options for the fx
     */
    constructor(target, options = {}) {
        this.active = true;
        this.deps = [];
        this.options = options;
        this.raw = (target instanceof Fx) ? target.raw : target;
        this.run = this.run.bind(this); // bind run
        if (!options.lazy) {
            this.run();
        }
    }
    /**
     * Pauses tracking of fx's
     * @returns {void}
     */
    static pauseTracking() {
        trackStack.push(tracking);
        tracking = false;
    }
    /**
     * Resumes tracking of fx's
     * @returns {void}
     */
    static resumeTracking() {
        trackStack.push(tracking);
        tracking = true;
    }
    /**
     * Resets tracking to previous state
     * @returns {void}
     */
    static resetTracking() {
        var _a;
        tracking = (_a = trackStack.pop()) !== null && _a !== void 0 ? _a : true;
    }
    /**
     * Tracks a reactive objects property for updates
     * @param {object|Proxy} target - Reactive object to anchor
     * @param {string|symbol} key - Property to track
     * @returns {void}
     */
    static track(target, key) {
        if (!exports.activeFx) {
            return;
        }
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let deps = depsMap.get(key);
        if (!deps) {
            depsMap.set(key, (deps = new Set()));
        }
        if (!deps.has(exports.activeFx)) {
            deps.add(exports.activeFx);
            exports.activeFx.deps.push(deps);
        }
    }
    /**
     * Triggers a change in a reactive object
     * @param {object|Proxy} target - Reactive object to anchor
     * @param {string} type - Trigger action type
     * @param {string|symbol} key - Property to trigger change on
     * @returns {void}
     */
    static trigger(target, type, key) {
        const depsMap = targetMap.get(target);
        if (!depsMap)
            return;
        const fxs = new Set();
        const computedFxs = new Set();
        const addRunners = (deps) => {
            if (deps && tracking) {
                for (const fx of deps) {
                    if (fx !== exports.activeFx) {
                        (fx.options.computed ? computedFxs : fxs).add(fx);
                    }
                }
            }
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
                const iterKey = Array.isArray(target) ? 'length' : exports.ITERATE_KEY;
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
    run(...args) {
        if (!this.active) {
            return this.raw(...args);
        }
        if (!exports.fxStack.includes(this)) {
            try {
                this.cleanup();
                Fx.resumeTracking();
                exports.fxStack.push(this);
                exports.activeFx = this;
                return this.raw(...args);
            }
            finally {
                exports.fxStack.pop();
                exports.activeFx = exports.fxStack[exports.fxStack.length - 1];
            }
        }
    }
    /**
     * Releases this fx from dependents
     * @returns {void}
     */
    cleanup() {
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
     * @return {void}
     */
    stop() {
        if (this.active) {
            this.cleanup();
            this.active = false;
        }
    }
}
exports.Fx = Fx;
//# sourceMappingURL=fx.js.map