# @kirei/element
## A next generation frontend library inspired by Vue Composition API and built with Web Components
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/E2E%20and%20Unit%20Tests?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![npm (scoped)](https://img.shields.io/npm/v/@kirei/element?style=for-the-badge&logo=npm)](https://npmjs.org/package/@kirei/element)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@kirei/element?label=Bundle%20size&style=for-the-badge)](https://npmjs.org/package/@kirei/element)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@kirei/element?label=Bundle%20size%20%28gzip%29&style=for-the-badge)](https://npmjs.org/package/@kirei/element)

Of course with typescript support.

## Installation
`npm install @kirei/element --save`

or if you use yarn

`yarn add @kirei/element`

## Usage
As this module has a heavily Vue Composition API inspired syntax, Vue's documentation can apply to most developer level APIs.

With there being some key differences of this syntax.

```js
import { defineElement, html } from '@kirei/element';

// Simple hello-world element
// When the "name" attribute changes in the DOM the element will update
// Defaults to 'World'
defineElement({
  name: 'HelloWorld',
  props: {
    name: {
      type: String,
      default: 'World',
    }
  },
  // Props is a reactive object, don't deconstruct it.
  setup(props) {
    return () => html`
      <h1>Hello ${props.name}</h1>
    `;
  }
});
```

TODO: describe how to use the module:
