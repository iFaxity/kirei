@kirei/hmr-api
==========================

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/Test%20and%20Deploy?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![npm (scoped)](https://img.shields.io/npm/v/@kirei/hmr-api?style=for-the-badge&logo=npm)](https://npmjs.org/package/@kirei/hmr-api)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@kirei/hmr-api?label=Bundle%20size&style=for-the-badge)](https://npmjs.org/package/@kirei/hmr-api)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@kirei/hmr-api?label=Bundle%20size%20%28gzip%29&style=for-the-badge)](https://npmjs.org/package/@kirei/hmr-api)

Hot Module Replacement API for Kirei Componet. This only includes the API and does not offer any automatic instrumentation. Consider using the babel plugin instead (babel-plugin-kirei).


Installation
--------------------------
`$ npm i @kirei/hmr-api`

or if you use yarn

`$ yarn add @kirei/hmr-api`


API
--------------------------

```js
import * as hmr from '@kirei/hmr-api';
```

### [hmr.create( filename, opts )](#create)

${method.description}

**Returns:** Component class

#### Parameters
* `filename {string}` - Unique id for the component,
* `opts {ComponentOptions}`-


### [hmr.update( filename, opts )](#update)

${method.description}

**Returns:** Component class

#### Parameters
* `filename {string}` -
* `opts {ComponentOptions}`-


### [hmr.createOrUpdate( filename, opts )](#createOrUpdate)

${method.description}

**Returns:** Component class

#### Parameters
* `filename {string}`-
* `opts {ComponentOptions}`-


### [hmr.has( filename, opts )](#has)

${method.description}

**Returns:** A boolean indicating if the ComponentInstance is defined within the HMR cache.

#### Parameters
* `filename {string}`-
* `opts {ComponentOptions}`-


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
