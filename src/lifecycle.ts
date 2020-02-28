import { activeElement, elementInstances } from './element';

type HookCallback = () => void;
export enum HookTypes {
  BEFORE_MOUNT = 'beforeMount',
  MOUNT = 'mount',
  BEFORE_UPDATE = 'beforeUpdate',
  UPDATE = 'update',
  BEFORE_UNMOUNT = 'beforeUnmount',
  UNMOUNT = 'unmount',
}

export const onBeforeMount = bindHook(HookTypes.BEFORE_MOUNT);
export const onMount = bindHook(HookTypes.MOUNT);
export const onBeforeUpdate = bindHook(HookTypes.BEFORE_UPDATE);
export const onUpdate = bindHook(HookTypes.UPDATE);
export const onBeforeUnmount = bindHook(HookTypes.BEFORE_UNMOUNT);
export const onUnmount = bindHook(HookTypes.UNMOUNT);

function bindHook(key: string): (fn: HookCallback) => void {
  return (fn: HookCallback) => {
    if (activeElement) {
      throw new Error('No active element instance!');
    }
  
    const instance = elementInstances.get(activeElement);
    instance.hooks[key].push(fn);
  };
}
