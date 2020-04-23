import { reactive, toRefs, toRef, Fx } from '@kirei/fx';
import { computedGetter } from '@kirei/fx/src/computed';
import { mapObject } from '@kirei/shared';

type StoreGetter<T = any> = () => T;
type StoreAction<T = any> = () => T;

interface StoreModule<T extends object> {
  namespaced?: boolean;
  state: T;
  getters?: Record<string, StoreGetter>;
  actions?: Record<string, StoreAction>;
}

interface StoreOptions<T extends object> {
  state: T;
  modules?: Record<string, StoreModule<any>>;
  getters?: Record<string, StoreGetter>;
  actions?: Record<string, StoreAction>;
}

class Store<T extends object> {
  readonly state: T;
  readonly getters: Record<string, StoreGetter>;
  readonly actions: Record<string, StoreAction>;
  private modules: Record<string, StoreModule<any>>;

  constructor(opts: StoreOptions<T>, prefix?: string) {
    this.state = reactive(opts.state);

    const props = mapObject((key, fn) => ([ key, { get: computedGetter(fn) } ]), opts.getters);
    this.getters = Object.defineProperties(Object.create(null), props);
  }

  dispatch(key: string): void {}
  subscribe(fn: Function): void {}
}

export function createStore<T extends object>(store: StoreOptions<T>) {
  return new Store(store);
}

const store = createStore({
  state: {
    kek: 'lel',
    hehe: 'hehe',
  },
  getters: {},
  actions: {},
});
