// Adapted from https://github.com/PatrykWalach/vuex-composition-api/blob/master/src/composition.ts
import { inject, reactive } from '@kirei/element';
import type { InjectionKey, UnwrapRef, Ref, App } from '@kirei/element';
export const INJECTION_KEY: InjectionKey<KireiStore> = Symbol('kirei::store');

/**
 * Unwraps refs recursively, essentially a reactive() from @vue/reactivity.
 */
export type UnwrapNestedRefs<T> = T extends Ref ? T : UnwrapRef<T>;

/**
 * Plugin function.
 * @param provide - Provider function set a value to the store context.
 */
export type Plugin = (provide: <T>(key: string, value: T) => void) => void;

/**
 * Store setup function, used to setup the state, getters and actions.
 * @param context - Store context where plugins are populated to.
 * @returns An object with state, getters and actions.
 */
export type Setup<T extends object> = (context: Context) => T;

/**
 * Store context, used to allow users apply custom plugins.
 */
export interface Context {
  /**
   * Composes another store as a module to the current store instance.
   * @param store - Store to extract functionality from.
   * @returns A reactive object where all refs are automatically unwrapped (essentially a reactive from @vue/reactivity).
   */
  use<T extends object>(store: Store<T>): UnwrapNestedRefs<T>;
}

/**
 * Store instance
 */
interface Store<T extends object> {
  /**
   * Store name, used when composing the store and to display informational messages.
   */
  name: string;

  /**
   * Setup function for this store, just like the composition api's setup function.
   */
  setup: Setup<T>;
}

/**
 * Root store options, only used to add plugins for now.
 */
interface StoreOptions {
  /**
   * Store plugins as functions to inject non-reactive obejcts into reactive states.
   */
  plugins: Plugin[];
}

/**
 * Root store, used to mount to an app instance.
 */
interface KireiStore {
  /**
   * Used to install the store onto a specific Kirei application instance.
   * @param app - App instance to install the store to.
   */
  install(app: App): void;

  /**
   * Composes another store as a module to the current store instance.
   * @param store - Store to extract functionality from.
   * @returns A reactive object where all refs are automatically unwrapped (essentially a reactive from @vue/reactivity).
   */
  store<T extends object>(store: Store<T>): UnwrapNestedRefs<T>;
}

/**
 * Creates a new root store to install to a Kirei app instance.
 * @param options - Optional store options to customise the store, such as plugins.
 * @returns A new root store instance
 */
export function createStore(options?: StoreOptions): KireiStore {
  const stores = new Map<string, unknown>();
  const setupContext: Context = Object.create(null);
  const rootStore: KireiStore = Object.create(null);

  function store<T extends object>({ name, setup }: Store<T>): UnwrapNestedRefs<T> {
    const store = stores.get(name);
    if (store) {
      return store as UnwrapNestedRefs<any>;
    }

    const instance = reactive(setup(setupContext));
    return stores.set(name, instance), instance;
  }

  function install(app: App) {
    app.provide(INJECTION_KEY, rootStore);
  }

  rootStore.install = install;
  rootStore.store = store;
  setupContext.use = rootStore.store;

  if (Array.isArray(options?.plugins)) {
    function pluginProvider(key: string, value: any): void {
      if (!(key in setupContext)) {
        setupContext[key] = value;
      } else if (__DEV__) {
        console.warn(`Store plugin ${key} already defined!`);
      }
    }

    options.plugins.forEach(plugin => plugin(pluginProvider));
  }

  return rootStore;
}

/**
 * Defines a new store instance, used as an argument to any store hook.
 * @param name - Store name, used when debugging and when mounting the store to a root store.
 * @param setup - Setup function, just like the composition api's setup function.
 * @returns The defined store instance.
 */
export function defineStore<T extends object>(name: string, setup: Setup<T>): Store<T> {
  return { name, setup };
}

/**
 * Composition hook to import a specified store into the current Kirei instance.
 * @param store - Store to extract functionality from.
 * @returns A reactive object where all refs are automatically unwrapped (essentially a reactive from @vue/reactivity).
 */
export function useStore<T extends object>(store: Store<T>): UnwrapNestedRefs<T> {
  const rootStore = inject(INJECTION_KEY);
  if (!rootStore) {
    throw new TypeError('No store provided');
  }

  return rootStore.store(store);
}
