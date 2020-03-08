import { HookTypes } from './shared';
import { activeElement, elementInstances } from './instance';

/**
 * Registers a new hook it runs before
 */
export const onBeforeMount = bindHook(HookTypes.BEFORE_MOUNT);
export const onMount = bindHook(HookTypes.MOUNT);
export const onBeforeUpdate = bindHook(HookTypes.BEFORE_UPDATE);
export const onUpdate = bindHook(HookTypes.UPDATE);
export const onBeforeUnmount = bindHook(HookTypes.BEFORE_UNMOUNT);
export const onUnmount = bindHook(HookTypes.UNMOUNT);

function bindHook(key: string): (fn: Function) => void {
  return (fn: Function) => {
    if (!activeElement) {
      throw new Error('Lifecycle hooks needs have a setup function in it\'s call stack.');
    }

    const instance = elementInstances.get(activeElement);
    const hooks = instance.hooks[key];
    hooks.add(fn);
  };
}
