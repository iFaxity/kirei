import { HookTypes, exception } from './shared';
import { activeInstance } from './instance';
const HOOKS = new Set<string>();

/**
 * Creates a new hook to set on the active instance
 * @param {string} hook Hook name
 * @return {Function}
 */
export function createHook(hook: string): (fn: Function) => void {
  if (HOOKS.has(hook)) {
    exception('A hook with that key already exists', `createHook(${hook})`);
  }

  // Keep track of what hook keys are used
  HOOKS.add(hook);
  return (fn: Function) => {
    if (!activeInstance) {
      exception('Lifecycle hooks needs have a setup function in it\'s call stack.');
    }

    let { hooks } = activeInstance;
    hooks[hook] = hooks[hook] ?? new Set();
    hooks[hook].add(fn);
  };
}

/** Registers a new hook it runs before instance is mounted */
export const onBeforeMount = createHook(HookTypes.BEFORE_MOUNT);
/** Registers a new hook it runs after instance is mounted */
export const onMount = createHook(HookTypes.MOUNT);
/** Registers a new hook it runs before instance is updated */
export const onBeforeUpdate = createHook(HookTypes.BEFORE_UPDATE);
/** Registers a new hook it runs after instance is updated */
export const onUpdate = createHook(HookTypes.UPDATE);
/** Registers a new hook it runs before instance is unmounted */
export const onBeforeUnmount = createHook(HookTypes.BEFORE_UNMOUNT);
/** Registers a new hook it runs after instance is unmounted */
export const onUnmount = createHook(HookTypes.UNMOUNT);
