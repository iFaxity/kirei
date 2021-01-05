<p class="center" style="text-align: center">
  <a href="https://github.com/iFaxity/kirei">
    <img width="80" src="https://raw.githubusercontent.com/iFaxity/kirei/master/logo.svg" alt="Kirei logo">
  </a>
</a>

<p class="center" style="text-align: center">

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/Test%20and%20Deploy?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![npm (scoped)](https://img.shields.io/npm/v/@kirei/element?style=for-the-badge&logo=npm)](https://npmjs.org/package/@kirei/element)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@kirei/element?label=Bundle%20size&style=for-the-badge)](https://npmjs.org/package/@kirei/element)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@kirei/element?label=Bundle%20size%20%28gzip%29&style=for-the-badge)](https://npmjs.org/package/@kirei/element)

</p>

<p class="center" style="text-align: center">

Browser support ([with WebComponents.js polyfills](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs))
------------------

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari-ios/safari-ios_48x48.png" alt="iOS Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>iOS Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/samsung-internet/samsung-internet_48x48.png" alt="Samsung" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Samsung | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Opera |
| -------- | --- | --- | --- | --- | -- | --- |
| Edge 15+ | 22+ | 35+ | 10+ | 10+ | 5+ | 36+ |

</p>

The beautiful front-end framework
---------------------------------

An in browser implementation of Vue 3 (limited to Composition API) powered by Web Components.

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

    return () => html`
      <button>Clicked ${count} times.</button>
    `;
  }
});
```

Then to use the element just include the script on the webpage and add the element (app-example) in the html code:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Kirei example</title>

    <!-- Change app.js to your script file -->
    <script src="https://unpkg.com/@kirei/element"></script>
    <script src="/app.js"></script>
  </head>
  <body>
    <h1>Kirei example element</h1>

    <app-example></app-example>
  </body>
</html>
```

Installation
--------------------------
`npm i @kirei/element`

or if you use yarn

`yarn add @kirei/element`

Features
--------
✔️ = Done, ⏳ = In progress, 📅 = Planned.

* ✔️ Custom Directives
* ✔️ Standard directives
  * ✔️ ref
  * ✔️ v-attrs
  * ✔️ v-if & v-unless
  * ✔️ v-show
  * ✔️ v-model
* ✔️ Events directive
* ✔️ Element emitters
* ✔️ Reactivity (with watch)
  * ✔️ watchEffect
  * ✔️ watch
* ✔️ Provide/inject
* ✔️ Central app instance
* ✔️ Scoped stylesheets
* ✔️ Hot Module reload (see the hmr-api package)
* ⏳ Lifecycle hooks (mount, update, unmount finished), error capture planned
* 📅 Portal
* 📅 Suspense

Defining an Element
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

There are 2 specific template literals that are exposed by the library *html* and *svg*, *svg* is used to render SVG content within a SVG namespace. Therefore any strict SVG content should be rendered within this literal. However *html* can also do SVG rendering if all SVG content has an SVG element as it's parent. Like normal inline SVG.

### Keyed templates

If you are rendering content often or in a loop it can be beneficial to use the key helper. As it caches the template and its values to prevent unnecessary compilations. 

As of now this is the only helper for the literals, more helpers might come later to help with specific pitfalls or just syntax sugar for the developer. A very basic but practical example:

```js
import { defineComponent, html, reactive, ref } from '@kirei/element';

const SimpleList = defineComponent({
  name: 'SimpleList',
  setup() {
    const list = reactive([]);
    const input = ref('');

    function add() {
      list.push({ id: list.length, text: input.value });
      input.value = '';
    }

    return () => html`
      <h1>Simple list</h1>
      <ul>
        ${list.map(x => html.key(x, x.id, html`
          <li>${x.text}</li>
        `))}
      </ul>

      <label>Write something</label>
      <input v-model=${input} @keyup.enter=${add}>
      <button @click=${add}>Add to list</button>
    `;
  },
});
```

Scoped Styles
-------------

As Chrome has support for Constructible stylesheets these are used when applicable. Otherwise it is shimmed with regular style elements in other browsers. If the browser does not support Shadow DOM, the library looks for the ShadyDOM polyfill to achieve similar results.

Therefore all the styles for every component is scoped. But could leak out if applied incorrectly. TODO: add examples of leaky styles.

Composition API
---------------

All reactivity is the same as of Version 1.2.0 as Kirei uses the @vue/reactivity package. However there are some Composition API's that are not in the reactivity package, and therefore implemented to emulate the same functionality. This means there is some limitations/differences.

### Watch

~~Note: Does not yet support the `deep` option, may come in a release further. But is not yet prioritised.~~

As of Version 2.0.0 the deep option is supported.

### Lifecycle hooks

The supported lifecycle hooks are **onMount**, **onMounted**, **onUpdate**, **onUpdated**, **onUnmount**, **onUnmounted**.
However there is a slight difference to how the *onUnmount* hook works, it is called when the component is *unmounted* from the DOM, not before. So both of the unmount hooks are run after each other synchronously.

There is also no is no onDestroy/onDestroyed hooks due to how WebComponents work and due to not having KeepAlive component yet.
Could be added for compatability but would just run in the same execution as onUnmount/onUnmounted and run after they have completed.

### Directives

Should be the same as Vue, except all directive names are hyphenated so all camelCased and PascalCased directives are hyphenated.
Also as they use the same lifecycle hooks as the component they have the same limitations as mentioned [here](#lifecycle-hooks).

### Portal

Not yet finished.

### Suspense

Not yet finished.

License
--------------------------

[MIT](./LICENSE)
