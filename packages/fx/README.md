@kirei/fx
==========================

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ifaxity/kirei/E2E%20and%20Unit%20Tests?style=for-the-badge&logo=github)](https://github.com/iFaxity/kirei/actions)
[![Codecov](https://img.shields.io/codecov/c/github/ifaxity/kirei?style=for-the-badge&logo=codecov)](https://codecov.io/gh/iFaxity/kirei)
[![Codacy grade](https://img.shields.io/codacy/grade/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![Codacy coverage](https://img.shields.io/codacy/coverage/dbdf69a34ba64733ace9d8aa204248ab?style=for-the-badge&logo=codacy)](https://app.codacy.com/manual/iFaxity/kirei/dashboard)
[![npm (scoped)](https://img.shields.io/npm/v/@kirei/fx?style=for-the-badge&logo=npm)](https://npmjs.org/package/@kirei/fx)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@kirei/fx?label=Bundle%20size&style=for-the-badge)](https://npmjs.org/package/@kirei/fx)
[![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@kirei/fx?label=Bundle%20size%20%28gzip%29&style=for-the-badge)](https://npmjs.org/package/@kirei/fx)

The core reactivity used in the Kirei Elements ecosystem, basically a slimmed down version of Vue 3's reactivity package. This package is intended for usage within the Kirei framework, but could be used standalone for other purposes.

This package does not support Internet Explorer as it uses the proxy object.

Installation
--------------------------
`$ npm i @kirei/fx`

or if you use yarn

`$ yarn add @kirei/fx`

API
--------------------------

```js
import { ... } from '@kirei/fx';
```

### [ref<T>( target )](#ref)

Creates a reactive reference of a value, objects are transformed into a reactive.

**Returns:** A Ref object, has three different members, value, toString() and valueOf().

#### Parameters
* `target {T | Ref<T>}` - A nested Ref is unwrapped to another Ref as nested refs are not allowed.

### [computed( target )](#computed)

Creates a computed getter (and setter) as a ref object, like a synthetic ref that caches the getter value, only updates when a dependency updates. Might not automatically update if the setter is called as it does not update the cache, unless a dependency is updated.

**Returns:** A [Ref](#ref) object.

#### Parameters
* `target {Computed<T>}` - function if getter only or object with get and set members as functions.

### [reactive( target )](#reactive)

Creates a reactive object that updates when a prop changes

**Returns:** The target object wrapped in a Proxy to track and trigger changes recursively, referred to as a Reactive.

#### Parameters
* `target {object}` - Object. Arrays and Collections (Set, Map, WeakSet, WeakMap) work as expected with full reactivity due to shimming with the Proxy object.

### [readonly( param1 [, param2 ] )](#readonly)

Creates and immutable reactive object, when trying to set/update a property it will throw a TypeError

**Returns:** returns

#### Parameters
* `target {object}` - Object. Arrays and Collections (Set, Map, WeakSet, WeakMap) work as expected with full reactivity due to shimming with the Proxy object.

### [watch( target, callback, [ options ] )](#watch)

Watches one or multiple sources for changes, to easily consume the updates with a before and after value. Has an option to trigger an immediate call (with oldValue set to undefined or empty array). Returns a function to effectivly stop the watcher.

**Returns:** returns

#### Parameters
* `target {WatchTarget|WatchTarget[]}` - Target or targets to watch
* `callback {WatchCallback}` - Callback to run when a target triggers an update
* `options {WatchOptions}` - Optional watcher options

### [watchEffect( target )](#watchEffect)

Creates a function that runs anytime a reactive dependency updates. Runs immediately to collect dependencies. Returns a function to effectivly stop the watcher.

**Returns:** returns

#### Parameters
* `target {Function}` - Function to run when an update is triggered




isObserver
isReactive
isReadonly
isRef
unRef
toRaw
toRawValue
toReactive
toReadonly
toRef
toRefs

Fx
  static pauseTracking
  static resetTracking
  static resumeTracking
  static track
  static trigger

  new
  cleanup
  run
  scheduleRun
  stop

  active
  deps
  raw
  scheduler



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


