import { KireiInstance } from '../instance';
import { warn } from '../logging';

export interface InjectionKey<T> extends Symbol {}

export function provide<T>(key: InjectionKey<T>|string, value: T): void {
  const instance = KireiInstance.active;
  instance.provide(key, value);
}

export function inject<T>(key: InjectionKey<T>|string, defaultValue?: T): T | undefined;
export function inject<T>(key: InjectionKey<T>|string, ...args: T[]): T {
  const instance = KireiInstance.active;
  if (instance) {
    const { provides } = instance;
    if (key in provides) {
      return provides[key as string];
    } else if (args.length) {
      return args[0];
    }

    warn(`Injection "${key}" not found.`);
  } else {
    warn(`inject() requires to have a setup function in its call stack.`);
  }
}
