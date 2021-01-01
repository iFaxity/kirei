@kirei/html
==========================

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/Test%20and%20Deploy?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![npm (scoped)](https://img.shields.io/npm/v/@kirei/html?style=for-the-badge&logo=npm)](https://npmjs.org/package/@kirei/html)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@kirei/html?label=Bundle%20size&style=for-the-badge)](https://npmjs.org/package/@kirei/html)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@kirei/html?label=Bundle%20size%20%28gzip%29&style=for-the-badge)](https://npmjs.org/package/@kirei/html)

A uhtml inspired render library with customizable directives, built in TypeScript.

Installation
--------------------------
`npm i @kirei/html`

or if you use yarn

`yarn add @kirei/html`

API
--------------------------

```js
import { html, svg, render, customize } from '@kirei/html';
```

### [html( strings, ...values )](#html)

Creates a html template from a string literal

**Returns:** Template instance of type html

**Parameters:**
* `strings {TemplateStringsArray}` - String glue
* `values {any[]}` - Interpolated values

### [svg( strings, ...values )](#svg)

Creates a svg template from a string literal

**Returns:** Template instance of type svg

**Parameters:**
* `strings {TemplateStringsArray}` - String glue
* `values {any[]}` - Interpolated values

### [render( template, root [, renderOptions] )](#render)

Renders a template to a specific root container

**Returns:** TemplateRenderer, object with 3 properties: html, svg and render.

**Parameters:**
* `template {Template|Node}` - Template or Node to render from
* `root {Element|ShadowRoot|DocumentFragment}` - Root node to render content to
* `renderOptions {RenderOptions}` - Custom render options, not rquired but used for web components shims
* `renderOptions.scopeName {string}` - Scope name to inform what tagName the targeted root has, only required if the root is a ShadowRoot for ShadyDOM/ShadyCSS to apply correctly.
* `renderOptions.mount {boolean}` - If false render will only compile the template and not render to root. Essentially preparing for a render but not actually applying it, defaults to true

### [customize( opts )](#customize)

Customizes a template rendered to define a compiler and static literals

**Returns:** Custom template renderer

**Parameters:**
* `opts {CustomizeOptions}` - Custom compiler options
* `opts.compiler {TemplateCompiler}` - Custom compiler to use instead of the default, will fallback to defaults if compiler does not implement all the members
* `opts.literals {TemplateLiteral}` - Helper methods to assign to the returned TemplateLiteral as static members

Examples
--------------------------

```js
import { html, render } from '@kirei/html';

// variables to hold state
const title = 'Hello world!';
const list = [ 'foo', 'bar', 'baz' ];
let count = 0;
let value = '';

// Event handlers
function onClick(e) {
  // Click handler to update the counter
  count++;
  update();
}

function onInput(e) {
  // Update "value" on input event
  value = e.currentTarget.value;
  update();
}

// Function to run updates on the template
function update() {
  const template = html`
    <h1>${title}</h1>
    <button @click=${onClick}>Clicked ${count} times</button>

    <p>Checkout this cool list</p>
    <ul>
      ${list.map(item => html`<li>${item}</li>`)}
    </ul>

    <label for="input">Write something</label>
    <input id="input" .value=${value} @input=${onInput}>
    <p>Input: ${value}</p>
  `;

  // Change document.body to valid Node that support childNodes
  // render remembers the last render cycle and only patches the dynamic data
  render(template, document.body);
}

// run initial render
update();
```

License
--------------------------

[MIT](./LICENSE)

