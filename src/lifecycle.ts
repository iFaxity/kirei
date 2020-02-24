import { activeElement, elementInstances, HookTypes } from './element';

type HookCallback = () => void;

function mountHook(key: string, fn: HookCallback): void {
  if (activeElement) {
    throw new Error('No active element instance!');
  }

  const instance = elementInstances.get(activeElement);
  instance.hooks[key].push(fn);
}

export function onBeforeMount(fn: HookCallback): void {
  mountHook(HookTypes.BEFORE_MOUNT, fn);
}

export function onMounted(fn: HookCallback): void {
  mountHook(HookTypes.MOUNTED, fn);
}

export function onBeforeUpdate(fn: HookCallback): void {
  mountHook(HookTypes.BEFORE_UPDATE, fn);
}

export function onUpdated(fn: HookCallback): void {
  mountHook(HookTypes.UPDATED, fn);
}

export function onBeforeUnmount(fn: HookCallback): void {
  mountHook(HookTypes.BEFORE_UNMOUNT, fn);
}

export function onUnmounted(fn: HookCallback): void {
  mountHook(HookTypes.UNMOUNTED, fn);
}
