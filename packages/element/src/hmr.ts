import { KireiInstance, KireiElement, NormalizedElementOptions } from './instance';


interface HMRCache {
  ctor: typeof KireiElement;
  instances: Set<KireiInstance>;
}
const hmrCache = new Map<string|number, HMRCache>();

export function registerElement(id: string, ctor: typeof KireiElement) {
  const cache = hmrCache.get(id);

  if (cache) {
    // Overwrite the static options
    cache.ctor.options = ctor.options;
    cache.instances.forEach(instance => {
      // gather all attributes, then remount
      // force element to remount
      const attrs = instance.el.attributes;
      instance.props
    });

    // force reload elements
    // update options on live instances
  } else {
    const instances = new Set<KireiInstance>();
    hmrCache.set(id, { instances, ctor });
  }
}

export function active() {
  return !!module.hot;
}

export function accept(id): void {
  // update observedAttributes and every instance
  // then reload every instance setup function and force re-render
  // keep the setup functions data?
  let cache = hmrCache.get(id);
}

export function dispose(id: string, callback: (data: any) => void): void {
  //??
}

export default function hot(srcModule: NodeModule) {
  // this should somehow be in the code of the element...
  // Maybe through some webpack plugin
  const id = srcModule.id ?? srcModule.filename;
  if (srcModule.hot) {
    accept(id);
    srcModule.hot.accept();
    srcModule.hot.dispose(callback => dispose(id, callback));
  }
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
