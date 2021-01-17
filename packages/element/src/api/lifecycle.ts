import { isFunction } from '@vue/shared';
import { getCurrentInstance } from '../runtime/instance';
import { exception } from '../logging';
const HOOKS = new Set<string>();

/**
 * An enumerator of the standard lifecycle hooks
 * @private
 */
export enum HookTypes {
  BEFORE_MOUNT = 'beforeMount',
  MOUNTED = 'mounted',
  BEFORE_UPDATE = 'beforeUpdate',
  UPDATED = 'updated',
  BEFORE_UNMOUNT = 'beforeUnmount',
  UNMOUNTED = 'unmounted',
  ERROR_CAPTURED = 'errorCaptured',
}

/**
 * Creates a new hook to set on the active instance
 * @param hook - Hook name
 * @return The defined hook factory
 */
export function defineHook<T extends Function>(name: string): (hook: T) => void {
  if (HOOKS.has(name)) {
    exception('A lifecycle hook with that identifier already exists', `defineHook(${name})`);
  }

  // Keep track of what hook keys are used
  HOOKS.add(name);
  return (hook) => {
    if (!isFunction(hook)) {
      exception('Lifecycle hooks requires the parameter to be a function.', `${hook}()`);
    }

    const instance = getCurrentInstance()
    if (!instance) {
      exception(`Lifecycle hooks needs have a setup function in its call stack.`, `${hook}()`);
    }

    instance.injectHook(name, hook);
  };
}

/** Registers a new hook it runs before instance is mounted */
export const onBeforeMount = defineHook(HookTypes.BEFORE_MOUNT);
/** Registers a new hook it runs after instance is mounted */
export const onMount = defineHook(HookTypes.MOUNTED);
/** Registers a new hook it runs before instance is updated */
export const onBeforeUpdate = defineHook(HookTypes.BEFORE_UPDATE);
/** Registers a new hook it runs after instance is updated */
export const onUpdate = defineHook(HookTypes.UPDATED);
/** Registers a new hook it runs before instance is unmounted */
export const onBeforeUnmount = defineHook(HookTypes.BEFORE_UNMOUNT);
/** Registers a new hook it runs after instance is unmounted */
export const onUnmount = defineHook(HookTypes.UNMOUNTED);

/** */
export const onErrorCaptured = defineHook(HookTypes.ERROR_CAPTURED);
