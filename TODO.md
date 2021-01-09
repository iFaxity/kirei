TODO list
===========

tests
-----------
* [o] Create tests using Cypress
* [o] Unit & integration tests, maybe e2e for whole cases (e.g making an app)
* [o] Test browsers with shimming (es6 compatible only)
* [] Move unit tests to each package (only use cypress for e2e)
* [] Put tests under each package in a `__test__` directory
  * [] Separate unit tests from integration tests

element
-----------
* [x] HMR reloading of component instances (reload setup, props, template, observedAttributes).
* [-] Find some way to preserve component instance state. (not possible without external state)
* [ ] Optimize partial updates of component instances.
* [ ] Add CSS variables to host component from setup (maybe?)
* [ ] Async components, with fallback content, Suspense like feature.
* [ ] Demos, to show both features and possibilities

html
-----------
* [ ] Optimize partial updates
* [ ] Render without mount, compile only

router
-----------
* [ ] Client router
* [ ] Server router

shared/core
------------
* [ ] Maybe move some of the generic functions from /element and /router to here
