babel-plugin-kirei
==========================

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/Test%20and%20Deploy?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![npm (scoped)](https://img.shields.io/npm/v/babel-plugin-kirei?style=for-the-badge&logo=npm)](https://npmjs.org/package/babel-plugin-kirei)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/babel-plugin-kirei?label=Bundle%20size&style=for-the-badge)](https://npmjs.org/package/babel-plugin-kirei)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/babel-plugin-kirei?label=Bundle%20size%20%28gzip%29&style=for-the-badge)](https://npmjs.org/package/babel-plugin-kirei)

Babel plugin for Kirei to instrument Kirei components to add Hot Module Replacement

Installation
--------------------------
`npm i -D babel-plugin-kirei`

or if you use yarn

`yarn add -D babel-plugin-kirei`

API
--------------------------

```js
import babelPlugin from 'babel-plugin-kirei';
```

### [babelPlugin( [ opts ] )](#kirei-plugin)

Creates the Babel plugin from a set of optional plugin options.

**Returns:** Babel Plugin

**Parameters:**
* `opts {KireiPluginOptions}` - Object of optional options to pass to the plugin
  * `include {string|string[]}` - Optional string or array of strings of glob patterns to include
  * `exclude {string|string[]}` - Optional string or array of strings of glob patterns to exclude
  * `extension {string|string[]}` - Optional string or array of strings of extensions to include (dot prefixed like .js or .ts)

Examples
--------------------------

To use this plugin define it using vite.config.js

```js

// vite.config.js
const kirei = require('babel-plugin-kirei');

module.exports = {
  open: true,
  port: 3000,
  plugins: [
    kirei({
      include: 'src/*',
      exclude: [/node_modules/, 'test/'],
      extension: [ '.js', '.ts' ],
    }),
  ],
};
```

Testing (TODO: not yet finished)
--------------------------

`npm run test`

License
--------------------------

[MIT](./LICENSE)
