import { KireiInstance } from '../instance';
import { warn } from '@kirei/shared';

export interface InjectionKey<T> extends Symbol {}

export function provide<T>(key: InjectionKey<T>|string, value: T): void {
  const instance = KireiInstance.active;
  let { provides, parent } = instance;

  if (parent?.provides === provides) {
    provides = instance.provides = Object.create(parent.provides);
  }
  provides[key as string] = value;
}

export function inject<T>(key: InjectionKey<T>|string): T | undefined;
export function inject<T>(key: InjectionKey<T>|string, defaultValue?: T): T {
  const instance = KireiInstance.active;
  if (instance) {
    const { provides } = instance;
    if (key in provides) {
      return provides[key as string];
    } else if (arguments.length > 1) {
      return defaultValue;
    }

    warn(`Injection "${key}" not found.`);
  } else {
    warn(`inject() requires to have a setup function in its call stack.`);
  }
}
