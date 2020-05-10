export declare enum TriggerOpTypes {
    SET = "set",
    ADD = "add",
    DELETE = "delete",
    CLEAR = "clear"
}
export declare const ITERATE_KEY: unique symbol;
export declare const fxStack: Fx[];
export declare let activeFx: Fx;
export interface FxOptions {
    lazy?: boolean;
    computed?: boolean;
    scheduler?(fn: Function): void;
}
export declare class Fx {
    active: boolean;
    options: FxOptions;
    deps: Set<Fx>[];
    raw: Function;
    /**
     * Creates a new Fx instance, runs function when a reactive dependents value changes
     * @param {Function|Fx} target - Runner function
     * @param {object} options - Options for the fx
     */
    constructor(target: Function | Fx, options?: FxOptions);
    /**
     * Pauses tracking of fx's
     * @returns {void}
     */
    static pauseTracking(): void;
    /**
     * Resumes tracking of fx's
     * @returns {void}
     */
    static resumeTracking(): void;
    /**
     * Resets tracking to previous state
     * @returns {void}
     */
    static resetTracking(): void;
    /**
     * Tracks a reactive objects property for updates
     * @param {object|Proxy} target - Reactive object to anchor
     * @param {string|symbol} key - Property to track
     * @returns {void}
     */
    static track(target: object, key: string | symbol | number): void;
    /**
     * Triggers a change in a reactive object
     * @param {object|Proxy} target - Reactive object to anchor
     * @param {string} type - Trigger action type
     * @param {string|symbol} key - Property to trigger change on
     * @returns {void}
     */
    static trigger(target: object, type: string, key?: string | symbol | number): void;
    /**
     * Runs the runner function to track dependencies, may run other runners recursively
     * @param {array} args
     * @returns {*}
     */
    run<T>(...args: any[]): T;
    /**
     * Releases this fx from dependents
     * @returns {void}
     */
    cleanup(): void;
    /**
     * Schedules a run of the runner function
     * @return {void}
     */
    scheduleRun(): void;
    /**
     * Marks fx as inactive and removes itself from the deps
     * @return {void}
     */
    stop(): void;
}
//# sourceMappingURL=fx.d.ts.map