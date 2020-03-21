
interface StoreOptions<T extends object> {
  state: T;
  getters?: {
    [key: string]: (state: Readonly<T>) => void;
  };
  mutations?: {
    [key: string]: (state: Readonly<T>) => void;
  };
  actions?: {
    [key: string]: (state: Readonly<T>) => void;
  };
  modules?: object;
}

class Store<T extends object, U = StoreOptions<T>> {
  state: T;

  constructor(options: U) {

  }

  dispatch(): void {}
  commit(): void {}
  subscribe(): void {}
}

export function createStore<T extends object>(store: StoreOptions<T>) {
  return new Store(store);
}

const store = createStore({
  state: {
    kek: 'lel',
    hehe: 'hehe',
  },
  actions: {
    kek(state) {
      ;
    },
  }
});

store.state
