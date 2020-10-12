@kirei/html
==========================

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/Cypress?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![npm (scoped)](https://img.shields.io/npm/v/@kirei/html?style=for-the-badge&logo=npm)](https://npmjs.org/package/@kirei/html)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@kirei/html?label=Bundle%20size&style=for-the-badge)](https://npmjs.org/package/@kirei/html)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@kirei/html?label=Bundle%20size%20%28gzip%29&style=for-the-badge)](https://npmjs.org/package/@kirei/html)

A uhtml inspired render library with customizable directives, built in TypeScript.

Installation
--------------------------
`$ npm i @kirei/html`

or if you use yarn

`$ yarn add @kirei/html`

API
--------------------------

```js
import { html, svg, render, customize } from '@kirei/html';
```

### [html( strings, ...values )](#html)

${method.description}

**Returns:** KireiElement class

#### Parameters
* `filename {string}` - Unique id for the element,
* `opts {ElementOptions}`-

### [svg( strings, ...values )](#svg)

${method.description}

**Returns:** KireiElement class

#### Parameters
* `filename {string}` -
* `opts {ElementOptions}`-

### [render( template, root [, scopeName] )](#render)

${method.description}

**Returns:** KireiElement class

#### Parameters
* `filename {string}`-
* `opts {ElementOptions}`-

### [customize( opts )](#customize)

${method.description}

**Returns:** A boolean indicating if the ElementInstance is defined within the HMR cache.

#### Parameters
* `opts {CustomizeOptions}` -
* `opts.compiler {TemplateCompiler}` -
* `opts.literals {TemplateLiteral}` -

Examples
--------------------------

```js
```

Testing
--------------------------

```sh
$ npm run test
```

License
--------------------------

[MIT](./LICENSE)

