Kirei
=============

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/E2E%20and%20Unit%20Tests?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)

Browser support
------------------

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari-ios/safari-ios_48x48.png" alt="iOS Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>iOS Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/samsung-internet/samsung-internet_48x48.png" alt="Samsung" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Samsung | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Opera |
| -------- | --- | --- | --- | --- | -- | --- |
| Edge 12+ | 18+ | 49+ | 10+ | 10+ | 5+ | 36+ |

The beautiful front-end framework
---------------------------------

To check an invididual package check in the packages folder.

The performance of the framework is surprisingly fast, checkout the [benchmark suite](https://github.com/ifaxity/js-framework-benchmark) to see how both the HTML parser and the element library compares to Vue, React, lit-element, etc.

The goal of this library is to provide a modern approach to Front-End with modern web standards such as Custom Elements, Constructable Stylesheets, HTML Templates, Template Literals, etc. But with the familiar syntax of Vue.

Transpiling is not required as most modern browsers supports all the required, and some features could be polyfilled. But could be added to automatically instrument the application with Hot Module Reload.

Example button element.

```js
import { defineElement, html, css, ref } from '@kirei/element';

defineElement({
  name: 'AppExample',
  props: {},
  closed: false,
  styles: css`
    button {
      background-color: red;
    }

    p {
      color: blue;
    }
  `,

  setup(props, ctx) {
    const count = ref(0);

    // Refs gets unwrapped unlike Vue
    return () => html`
      <button>
        Clicked ${count} times.
      </button>
    `;
  }
});
```

Defining an Element
-------------------

Every element requires defineElement to be called in order to define a custom element.

defineElement returns the element class constructor to.

The **only** required options is the *name* property and *setup* function. The name property should strictly be the `PascalCased` or `snake-cased` element name.

The setup function is where all the reactivity and element interactivity gets set-up. It has two optional arguments `props` and `ctx`. Props is a special reactive object which holds the current value of the props. As it is reactive it is possible to set or get values.

`ctx` is a special object that contains certain helper functions for the element.

The return value requires a function which returns a HTML template via the packages `html` template literal.


```js
defineElement()
const AppElement = defineElement({
  name: string,
  props: Props,
  closed: boolean,
  styles: CSSStyleSheet|CSSStyleSheet[],
  setup(props: KireiProps, ctx: KireiContext): () => HTMLTemplate;
});
```

HTML & SVG Templates
--------------------

TODO:

### Keyed templates

TODO:

### Directives

TODO:

### Standard directives

TODO:

Scoped Styles
-------------

TODO:

Composition API
---------------

### Provide & Inject

Provide/inject are just like from Vue 2-3. It is used for an element to share functionality to child elements.
As provided values only flows downward it is not possible for members to leak to parents
As it only flows to children it is not possible to leak members to parent elements.

```js
import { html, defineElement, provide, inject } from '@kirei/element';

defineElement({
  name: 'ParentElement',
  setup() {
    const count = ref(0);
    provide('count', count);

    return () => html`
      <label for="counter">Counter</label>
      <input id="counter" &=${count}>
      <child-element></child-element>
    `;
  }
});

defineElement({
  name: 'ChildElement',
  setup() {
    const count = inject('count');

    // count is now injected from ParentElement
    return () => html`<p>Count is ${count}</p>`;
  }
});
```

Lifecycle hooks
---------------

### onMount/onMounted
### onUpdate/onUpdated
### onUnmount/onUnmounted

There is no onDestroy/onDestroyed hooks due to how custom elements does not have a way to track garbage collected elements.

Portal
------

### Custom Directive

Of course you can create your own directives, they can either be defined globally or just within the scope of a single element.

```js
import { directive } from '@kirei/element';

// Registers the global directive "text"
directive('text', dir => {
  return (newValue) => {
    dir.el.textContent = String(newValue);
  };
});

// Registers the scoped directive "focus"
defineElement({
  name: 'BaseExample',

  directives: {
    focus(dir) {
      return (newValue) => {
        
      };
    }
  }
});
```

Reactive API
------------
Always define a reactive element

### Ref

Ref is the recommended way to bind native values as a reactive element.

```js
const count = ref(0);

// Initial value is optional
const text = ref();

// nested refs copies the value
const nested = ref(ref(true));
nested.value // returns true
```

Unlike Vue, ref is a prototype of an object with toString and valueOf implemented, therefore it is possible to implicitly unwrap the value.

For example:
```js
const count = ref(10);

console.log(`Count is ${num}`); // implicit num.toString()
console.log(`Count + 3 is ${num + 3}`); // implicit num.valueOf
```

### Computed

Computed is a synthetic ref that only updates its value when a dependency triggers an update. And caches the value from the last update.

```js
// No reactive dependency, will cache the value
//  and won't run again
const greeting = computed(() => {
  return Math.random();
});

// if name is updated, the computed will update its cache
const name = ref('World');
const greeting = computed(() => {
  return `Hello ${name}!`;
});

name.value = 'Kirei';
```

There is also a way to utilize a setter to do some kind of update, perhaps one of the dependencies of the getter to trigger an update of the cache. As the getter only updates the cache if a dependency triggers an update.

```js
const progress = ref(0);
const PROGRESS_MAX = 150;

// getter and setter
const counterPercent = computed({
  get() {
    return (counter.value / PROGRESS_MAX) * 100;
  },
  set(value) {
    // update progress to trigger getter update
    progress.value = value;
  }
});
```

### Reactive

Reactive binds an object, array or collection (Map/Set/WeakMap/WeakSet) as a reactive element.

The Reactive uses a Proxy so creating/deleting elements like normal works just like expected. Even the functions like .indexOf(), .lastIndexOf(), .includes(), .keys(), .values(), .entries() and lastly the iterator protocol. These all track dependencies like expected and should not cause any side effects.

```js
const object = reactive({});
const array = reactive([]);
const map = reactive(new Map());
const zet = reactive(new Set());


```

However with a proxy it is not possible to deconstruct properties as they will decouple the tracking by the Proxy and return the value directly. Unless it is an object itself which returns a reactive.


### Readonly

Readonly is just like reactive however like the name implies, it is immutable. No members may be changed or deleted.

```js
const obj = readonly({});
const list = readonly([]);
const hashMap = readonly(new Map());
const hashSet = readonly(new Set());

// ok
const oval = obj.foo;
const lval = list[0]
const mapval = hashMap.get('foo');
const setval = hashSet.has('hi');

// will throw error
obj.foo = 'bar';
list.push('test');
hashMap.set('foo', 'bar');
hashSet.add('hi');
```

Subscribe to reactive changes
-----------------------------

### watchEffect

Watch effect works as a function that runs whenever a dependency triggers an update.

```js
watchEffect(() => {

});
```

### watch

The watch function is no yet fully finished but will work in a similar way to the Composition API spec.
The purpose of watch is to watch for changes in specific dependencies, and show both the old and new value.

```js
watch(() => {}, (value, oldValue) => {

});
```
