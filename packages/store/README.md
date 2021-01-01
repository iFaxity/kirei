@kirei/store
==========================

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/Test%20and%20Deploy?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![npm (scoped)](https://img.shields.io/npm/v/@kirei/store?style=for-the-badge&logo=npm)](https://npmjs.org/package/@kirei/store)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@kirei/store?label=Bundle%20size&style=for-the-badge)](https://npmjs.org/package/@kirei/store)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@kirei/store?label=Bundle%20size%20%28gzip%29&style=for-the-badge)](https://npmjs.org/package/@kirei/store)

A Vuex inspired store implementation with Composition API and full TypeScript support.

Most of the code is adapted from [vuex-composition-api](https://github.com/PatrykWalach/vuex-composition-api/blob/master/src/composition.ts) with some modifications to the structure, but the functionality is basically the same.

Installation
--------------------------
`npm i @kirei/store`

or if you use yarn

`yarn add @kirei/store`

API
--------------------------

```js
import { createStore, defineStore, useStore } from '@kirei/store';
```

### [createStore( [options] )](#create-store)

Creates a new root store to install to a Kirei app instance.

**Returns:** A new root store instance

**Parameters:**
* `options {StoreOptions}` - Optional store options to customise the store, such as plugins.
  * `options.plugins {Plugin[]}` - Store plugins to add external functionality, such as data fetching.

### [defineStore<T extends object>( name, setup )](#define-store)

Defines a new store instance, used as an argument to any store hook.

**Returns:** The defined store instance.

**Parameters:**
* `name {string}` - Store name, used when debugging and when mounting the store to a root store.
* `setup {Setup<T>}` - Setup function, just like the composition api's setup function.

### [useStore<T extends object>( store )](#use-store)

Composition hook to import a specified store into the current Kirei instance.

Keep in mind that the root store has to be installed into the app for the useStore hook to work. Also DO NOT deconstruct properties, it wont work as expected and removes the reactivity from the importer properties.

**Returns:** A reactive object where all refs are automatically unwrapped (essentially a reactive from @vue/reactivity).

**Parameters:**
* `store {Store<T>}` - Store to extract functionality from.
  * `store.name {string}` - Store name, used when debugging and when mounting the store to a root store.
  * `store.setup {Setup<T>}` - Setup function, just like the composition api's setup function.

Examples
--------------------------

```js
import { defineComponent, createApp, html, ref, computed, toRef } from '@kirei/element';
import { createStore, defineStore, useStore } from '@kirei/store';

const app = createApp('app');
app.install(createStore());

const CounterStore = defineStore('appStore', () => {
  // state
  const count = ref(0);

  // getters
  const isEven = computed(() => count.value % 2 == 0);

  // actions
  function increment() {
    count.value += 1;
  }

  function decrement() {
    count.value -= 1;
  }

  return {
    count,
    isEven,
    increment,
    decrement,
  };
});

defineComponent({
  name: 'AppCounter',
  setup() {
    const store = useStore(CounterStore);
    const text = toRef(store, 'text'); // v-model in Kirei requires a ref

    return () => html`
      <p>Count is: ${store.count}</p>
      <p>Count is ${store.isEven ? 'even' : 'odd'}.</p>
      <button @click=${store.increment}>Increment</button>
      <button @click=${store.decrement}>Decrement</button>
    `;
  },
});

// then somewhere in your html code add the component: <app-counter id='app'></app-counter>, or:
// const $root = document.createElement('app-counter');
// $root.id = 'app';
// document.body.appendChild($root);
```

License
--------------------------

[MIT](./LICENSE)

