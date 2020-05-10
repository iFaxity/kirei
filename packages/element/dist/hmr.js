"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hmrCache = new Map();
function registerElement(name, ctor) {
    if (hmrCache.has(name)) {
        // Overwrite the static options
        const cache = hmrCache.get(name);
        cache.ctor.options = ctor.options;
        // reload elements?
        // update options on live instances
    }
    else {
        const instances = new Set();
        hmrCache.set(name, { instances, ctor });
    }
}
exports.registerElement = registerElement;
function active() {
    return !!module.hot;
}
exports.active = active;
function accept() {
    // update observedAttributes and every instance
    // then reload every instance setup function and force re-render
    // keep the setup functions data?
    let id = '';
    let cache = hmrCache.get(id);
}
exports.accept = accept;
function dispose(data) {
    //??
}
exports.dispose = dispose;
// this should somehow be in the code of the element...
// Maybe through some webpack plugin
if (module.hot) {
    module.hot.accept(accept);
    module.hot.dispose(dispose);
}
/*module.hot.accept(() => {
  walk(document.body, node => {
    if (node.localName === window.__hot[filename]) {
      // This ensures any stuff being used here as side-effects when the
      // elemnt is defined (it's called and stored at that time) happens.
      ctor.observedAttributes;

      // We grab the descriptors we care about and apply then to the existing
      // node.
      const descriptorsS = Object.getOwnPropertyDescriptors(ctor);
      const descriptorsI = Object.getOwnPropertyDescriptors(ctor.prototype);

      // Static.
      for (const name in descriptorsS) {
        if (name !== 'length' && name !== 'name' && name !== 'prototype') {
          Object.defineProperty(node.constructor, name, descriptorsS[name]);
        }
      }

      // Instance.
      for (const name in descriptorsI) {
        Object.defineProperty(node, name, descriptorsI[name]);
      }

      // This ensures the lifecycle can begin as the new element.
      if (node.connectedCallback) {
        node.connectedCallback();
      }
    }
  });
});
module.hot.dispose(() => {
  if (!window.__hot) {
    window.__hot = {};
  }
  if (!window.__hot[filename]) {
    window.__hot[filename] = new ctor().localName;
  }
});*/
//# sourceMappingURL=hmr.js.map