Kirei
=============

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/Test%20and%20Deploy?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)

Browser support ([with WebComponents.js polyfills](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs))
------------------

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari-ios/safari-ios_48x48.png" alt="iOS Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>iOS Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/samsung-internet/samsung-internet_48x48.png" alt="Samsung" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Samsung | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Opera |
| -------- | --- | --- | --- | --- | -- | --- |
| Edge 15+ | 22+ | 35+ | 10+ | 10+ | 5+ | 36+ |

The beautiful front-end framework
---------------------------------

Now also uses the same reactivity as Vue 3 (**@vue/reactivity**) instead of the custom fork (**@kirei/fx**).

The goal of this library is to provide a modern approach to Front-End with modern web standards such as Custom Elements, Constructable Stylesheets, HTML Templates, Template Literals, etc. But with the familiar syntax of Vue.

Transpiling is not required as most modern browsers supports all the required, and some features could be polyfilled. But could be added to automatically instrument the application with Hot Module Reload.

The performance of the framework is surprisingly fast, checkout the [benchmark suite](https://github.com/ifaxity/js-framework-benchmark) to see how both the HTML parser and the full component library compares to Vue, React, lit-element, etc.

Example button component.

```js
import { defineComponent, html, css, ref } from '@kirei/element';

defineComponent({
  name: 'AppExample',
  props: {},
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
      <button>Clicked ${count} times.</button>
    `;
  }
});
```

Defining a component
-------------------

Every component requires defineComponent to be called in order to define a custom component.

The **only** required options is the *name* property and *setup* function. The name property should strictly be the `PascalCased` or `snake-cased` component name.

The setup function is where all the reactivity and component interactivity gets set-up. It has two optional arguments `props` and `ctx`. Props is a special reactive object which holds the current value of the props. As it is reactive it is possible to set or get values.

`ctx` is a special object that contains certain helpers for the setup function.

The return value requires a function which returns a HTML template via the packages `html` template literal.


```js
const AppComponent = defineComponent({
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

All reactivity is the same as of Version 1.2.0 as Kirei uses the @vue/reactivity package. However there are some Composition API's that are not in the reactivity package, and therefore implemented

### watch

Note: Does not yet support the `deep` option, may come in a release further. But is not yet prioritised.

### watchEffect

TODO:

### Provide & Inject

Provide/inject is identical to Vue. It is used for an component to share functionality to child components.

As provided members only flows downward it is not possible for them to flow upward to any parents.
As it only flows to children it is not possible to leak members to parent components.

```js
import { html, defineComponent, provide, inject } from '@kirei/element';

defineComponent({
  name: 'ParentComponent',
  setup() {
    const count = ref(0);
    provide('count', count);

    return () => html`
      <label for="counter">Counter</label>
      <input id="counter" &=${count}>
      <child-component></child-component>
    `;
  }
});

defineComponent({
  name: 'ChildComponent',
  setup() {
    const count = inject('count');

    // count is now injected from ParentComponent
    return () => html`<p>Count is ${count}</p>`;
  }
});
```

Lifecycle hooks
---------------

TODO:

### onMount/onMounted
### onUpdate/onUpdated
### onUnmount/onUnmounted

There is no onDestroy/onDestroyed hooks due to how custom elements does not have a way to track garbage collected elements.

Portal
------

TODO:

Directives
----------

Directives acts totally differently from Vue, as the only supported way as of now is to run on update. As there is no way to identify if the directive is bound or unbound. Therefore the sole way to use the directive is through getting updates when the component is re-rendered.

### Custom Directive

Of course you can create your own directives, they can either be defined globally or just within the scope of a single component. However the Directive arguments is the same. `{ el: HTMLElement, args: string[], name: string }`

```js
import { directive, createApp } from '@kirei/element';

const app = createApp();

// Registers the global directive "text"
app.directive('text', {
  updated(el, { value }) {
    el.textContent = value;
  },
});

// Registers the component scoped directive "focus", focuses on the targeted element after mount
defineComponent({
  name: 'BaseExample',

  directives: {
    focus: {
      mounted(el) {
        el.focus();
      }
    },
  }
});
```
