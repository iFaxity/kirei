import { activeElement, HookTypes } from './element';

type HookCallback = () => void;

export function onBeforeMount(fn: HookCallback): void {
  if (activeElement) {
    activeElement._hooks[HookTypes.BEFORE_MOUNT].push(fn);
  }
}

export function onMounted(fn: HookCallback): void {
  if (activeElement) {
    activeElement._hooks[HookTypes.MOUNTED].push(fn);
  }
}

export function onBeforeUpdate(fn: HookCallback): void {
  if (activeElement) {
    activeElement._hooks[HookTypes.BEFORE_UPDATE].push(fn);
  }
}

export function onUpdated(fn: HookCallback): void {
  if (activeElement) {
    activeElement._hooks[HookTypes.UPDATED].push(fn);
  }
}

export function onBeforeUnmount(fn: HookCallback): void {
  if (activeElement) {
    activeElement._hooks[HookTypes.BEFORE_UNMOUNT].push(fn);
  }
}

export function onUnmounted(fn: HookCallback): void {
  if (activeElement) {
    activeElement._hooks[HookTypes.UNMOUNTED].push(fn);
  }
}
