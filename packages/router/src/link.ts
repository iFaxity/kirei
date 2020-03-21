// link part
import { onUnmount, Part, createAttributePart } from '@shlim/element';
import { Router } from './Router';

export function routerView(router: Router, el: Element) {
  if (router) {
    router.register(el);
    onUnmount(() => router.unregister(el));
  }
}

export interface LinkOptions {
  path?: string;
  name?: string;
  params?: object;
  query?: object;
}

class LinkPart implements Part {
  el: Element;
  value: string|LinkOptions;
  replace: boolean = false;
  append: boolean = false;
  exact: boolean = false;

  constructor(el: Element, name: string) {
    let mods = name.split('.').slice(1);

    this.el = el;
    this.replace = mods.includes('replace');
    this.append = mods.includes('append');
    this.exact = mods.includes('exact');

    el.addEventListener('click', e => {
      e.preventDefault();

      /*let path = this.value as string;
      if (this.append) {
        path = router.path + path;
      }

      const res = router[this.replace ? 'replace' : 'push'](path);
      res && this.commit();*/
    });
  }

  commit(): void {
    /*const currentPath = router.path;
    const path = this.value as string;

    if (currentPath.startsWith(path)) {
      this.el.classList.add(router.activeClass);

      if (this.exact && path == currentPath) {
        this.el.classList.add(router.exactClass);
      }
    }*/
  }

  setValue(newValue: string): void {
    if (this.el.localName == 'a') {
      this.el.setAttribute('href', newValue);
    }

    this.value = newValue;
  }
}

createAttributePart({
  name: 'link',
  shorthand: '#',
  factory(el, name, strings, options) {
    return [ new LinkPart(el, name) ];
  }
})
