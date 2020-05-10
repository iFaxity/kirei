@kirei/element
===================

## A next generation frontend library inspired by Vue Composition API and built with Web Components 
Of course with typescript support.

------------------
## Installation:

`npm install @kirei/element --save`

or if you use yarn

`yarn add @kirei/element`

--------
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
