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
    scheduler?: (fn: Function) => void;
}
export declare class Fx {
    active: boolean;
    options: FxOptions;
    deps: Set<Fx>[];
    raw: Function;
    /**
     * Creates a new Fx instance, runs function when a reactive dependents value changes
     * @param {function} target - Runner function
     * @param {object} options - Options for the fx
     *
     * @return {Fx}
     */
    constructor(target: Function | Fx, options?: FxOptions);
    /**
     * Checks if an object is an Fx instance
     * @param {*} obj
     *
     * @return {boolean}
     */
    static isFx(obj: unknown): boolean;
    /**
     * Tracks a reactive objects property for updates
     * @param {object|Proxy} target - Reactive object to anchor
     * @param {string|symbol} key - Property to track
     *
     * @return {void}
     */
    static track(target: object, key: string | symbol | number): void;
    /**
     * Triggers a change in a reactive object
     * @param {object|Proxy} target - Reactive object to anchor
     * @param {string} type - Trigger action type
     * @param {string|symbol} key - Property to trigger change on
     *
     * @return {void}
     */
    static trigger(target: object, type: string, key?: string | symbol | number): void;
    /**
     * Runs the runner function to track dependencies, may run other runners recursively
     * @param {array} args
     *
     * @return {void}
     */
    run<T>(...args: any[]): T;
    /**
     * Releases this fx from dependents
     */
    cleanup(): void;
    /**
     * Schedules a run of the runner function
     *
     * @return {void}
     */
    scheduleRun(): void;
    /**
     * Marks fx as inactive and removes itself from the deps
     *
     * @return {void}
     */
    stop(): void;
}
//# sourceMappingURL=fx.d.ts.map