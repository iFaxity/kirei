@kirei/vite-plugin
==========================

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/E2E%20and%20Unit%20Tests?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![npm (scoped)](https://img.shields.io/npm/v/@kirei/vite-plugin?style=for-the-badge&logo=npm)](https://npmjs.org/package/@kirei/vite-plugin)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@kirei/vite-plugin?label=Bundle%20size&style=for-the-badge)](https://npmjs.org/package/@kirei/vite-plugin)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@kirei/vite-plugin?label=Bundle%20size%20%28gzip%29&style=for-the-badge)](https://npmjs.org/package/@kirei/vite-plugin)

Vite plugin for Kirei to instrument Kirei elements to add Hot Module Replacement via Babel (babel-plugin-kirei).

Installation
--------------------------
`$ npm i -D @kirei/vite-plugin`

or if you use yarn

`$ yarn add -D @kirei/vite-plugin`

API
--------------------------

```js
import kireiPlugin from '@kirei/vite-plugin';
```

### [kireiPlugin( [ opts ] )](#kirei-plugin)

Constructs the vite plugin from a set of optional plugin options.

**Returns:** Vite Plugin

#### Parameters
* `opts {KireiPluginOptions}` - Object of optional options to pass to the plugin
  * `include {string|string[]}` - Optional string or array of strings of glob patterns to include
  * `exclude {string|string[]}` - Optional string or array of strings of glob patterns to exclude
  * `extension {string|string[]}` - Optional string or array of strings of extensions to include (dot prefixed like .js or .ts)

Examples
--------------------------

To use this plugin define it using vite.config.js

```js
// vite.config.js
const kirei = require('@kirei/vite-plugin');
const kireiOptions = {
  include: 'src/*',
  extension: [ '.js', '.ts' ],
};

module.exports = {
  // ...options
  plugins: [
    kirei(kireiOptions),
  ],
};
```

Testing (TODO: not yet finished)
--------------------------

`$ npm run test`

License
--------------------------

[MIT](./LICENSE)
