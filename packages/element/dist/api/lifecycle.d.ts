export declare enum HookTypes {
    BEFORE_MOUNT = "beforeMount",
    MOUNT = "mount",
    BEFORE_UPDATE = "beforeUpdate",
    UPDATE = "update",
    BEFORE_UNMOUNT = "beforeUnmount",
    UNMOUNT = "unmount"
}
/**
 * Creates a new hook to set on the active instance
 * @param {string} hook Hook name
 * @return {Function}
 */
export declare function defineHook<T = () => void>(name: string): (hook: T) => void;
/** Registers a new hook it runs before instance is mounted */
export declare const onBeforeMount: (hook: () => void) => void;
/** Registers a new hook it runs after instance is mounted */
export declare const onMount: (hook: () => void) => void;
/** Registers a new hook it runs before instance is updated */
export declare const onBeforeUpdate: (hook: () => void) => void;
/** Registers a new hook it runs after instance is updated */
export declare const onUpdate: (hook: () => void) => void;
/** Registers a new hook it runs before instance is unmounted */
export declare const onBeforeUnmount: (hook: () => void) => void;
/** Registers a new hook it runs after instance is unmounted */
export declare const onUnmount: (hook: () => void) => void;
//# sourceMappingURL=lifecycle.d.ts.map