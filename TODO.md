TODO list
===========

tests
-----------
* [o] Create tests using Cypress
* [o] Unit & integration tests, maybe e2e for whole cases (e.g making an app)
* [ ] Test browsers with shimming (es6 compatible only)

element
-----------
* [x] HMR reloading of element instances (reload setup, props, template, observedAttributes).
* [-] Find some way to preserve element instance state. (not possible without external state)
* [ ] Optimize partial updates of element instances.
* [ ] Add CSS variables to host element from setup (maybe?)
* [ ] Async elements, with fallback content, Suspense like feature.

fx
-----------
* [ ] Investigate optimizations (should be ok now, matching Vue3's performance)

html
-----------
* [ ] Optimize partial updates
* [ ] Add support for SSR, no access to WebDOM (e.g template element)

router
-----------
* [ ] Client router
* [ ] Server router

ssr
-----------
* [ ] Investigate how to do this, or if to do this. As custom elements are automatically hydrated.
      Maybe create this to have unison between front and backend.
* [ ] Content is provided by slots and attributes
