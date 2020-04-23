import { exception, isFunction } from '@kirei/shared';
import { FxInstance } from '../instance';
const HOOKS: string[] = [];

export enum HookTypes {
  BEFORE_MOUNT = 'beforeMount',
  MOUNT = 'mount',
  BEFORE_UPDATE = 'beforeUpdate',
  UPDATE = 'update',
  BEFORE_UNMOUNT = 'beforeUnmount',
  UNMOUNT = 'unmount',
}

/**
 * Creates a new hook to set on the active instance
 * @param {string} hook Hook name
 * @return {Function}
 */
export function defineHook<T = () => void>(name: string): (hook: T) => void {
  if (HOOKS.includes(name)) {
    exception('A lifecycle hook with that key already exists', `defineHook(${name})`);
  }

  // Keep track of what hook keys are used
  HOOKS.push(name);
  return (hook: T) => {
    const instance = FxInstance.active;
    if (!instance) {
      exception('Lifecycle hooks needs have a setup function in it\'s call stack.');
    } else if (!isFunction(hook)) {
      exception('Lifecycle hooks requires the parameter to be a function.');
    }

    const { hooks } = instance;
    hooks[name] = hooks[name] ?? new Set();
    hooks[name].add(hook);
  };
}

/** Registers a new hook it runs before instance is mounted */
export const onBeforeMount = defineHook(HookTypes.BEFORE_MOUNT);
/** Registers a new hook it runs after instance is mounted */
export const onMount = defineHook(HookTypes.MOUNT);
/** Registers a new hook it runs before instance is updated */
export const onBeforeUpdate = defineHook(HookTypes.BEFORE_UPDATE);
/** Registers a new hook it runs after instance is updated */
export const onUpdate = defineHook(HookTypes.UPDATE);
/** Registers a new hook it runs before instance is unmounted */
export const onBeforeUnmount = defineHook(HookTypes.BEFORE_UNMOUNT);
/** Registers a new hook it runs after instance is unmounted */
export const onUnmount = defineHook(HookTypes.UNMOUNT);
