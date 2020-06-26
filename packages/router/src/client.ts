import { KireiInstance, directive, computed, watchEffect } from '@kirei/element';
import { Link, RouterOptions, RouterInterface, Router } from './router';
const SUPPORTS_HISTORY = !!(window.history?.pushState);

export class ClientRouter extends Router implements RouterInterface {
  readonly views: Node[] = [];
  readonly history: boolean;

  /*get path(): string {
    return this.history ? location.pathname : location.hash.slice(1);
  }*/

  constructor(opts: RouterOptions) {
    super(opts);
    // Force hash mode if HistoryAPI not supported
    this.history = SUPPORTS_HISTORY && (opts.history !== false);
    this.path.value = this.history ? location.pathname : location.hash.slice(1);

    // Watch for changes to location state
    const navigate = () => this.navigate();
    window.addEventListener(this.history ? 'popstate' : 'hashchange', navigate, false);
    window.addEventListener('DOMContentLoaded', navigate, false);

    // Add link directive
    directive('link', dir => {
      const { el, mods } = dir;
      const replace = mods.includes('replace');
      const append = mods.includes('append');
      const exact = mods.includes('exact');
      let link: Link;
      let linkpath: string;

      const commit = (path: string) => {
        let isActive = path.startsWith(linkpath);

        const isExact = isActive && exact && linkpath === path;
        el.classList[isActive ? 'add' : 'remove'](this.activeClass);
        el.classList[isExact ? 'add' : 'remove'](this.exactClass);
      };
      watchEffect(() => commit(this.path.value));

      // Navigates the route
      el.addEventListener('click', e => {
        e.preventDefault();
        this[replace ? 'replace' : 'push'](link, append);
      });

      return (pending: Link) => {
        if (pending === link && !append) return;

        linkpath = this.resolve(pending, append);
        link = pending;

        // Anchor tags requires a href attribute
        if (el.localName == 'a') {
          el.setAttribute('href', this.history ? linkpath : `#${linkpath}`);
        }
      };
    });
  }

  attach(instance: KireiInstance): void {
    const { views, instances } = this;

    // Comment node is used to mark the node reference
    const ref = document.createComment('');
    instance.el.appendChild(ref);
    instances.push(instance);
    views.push(ref);
  }

  detach(instance: KireiInstance): void {
    const { views, instances } = this;

    const idx = instances.indexOf(instance);
    instances.splice(idx, 1);
    views.splice(idx, 1);
  }

  push(link: Link, append: boolean): void {
    const path = this.resolve(link, append);
    if (this.history) {
      history.pushState(null, null, path);
    } else {
      location.hash = path;
    }

    this.navigate();
  }

  replace(link: Link, append: boolean): void {
    const path = this.resolve(link, append);
    if (this.history) {
      history.replaceState(null, null, path);
    } else {
      location.hash = path;
    }

    this.navigate();
  }

  protected async navigate(): Promise<void> {
    this.path.value = this.history ? location.pathname : location.hash.slice(1);

    const matched = this.matchRoutes();
    if (matched == null) return;

    const { views, instances } = this;
    for (let idx = 0; idx < matched.length; idx++) {
      const instance = instances[idx];
      const route = matched[idx];
      const root = instance.el;
      const view = views[idx];

      // Replace node if view elements are not the same
      KireiInstance.active = instance;
      const el = await route.element();
      if (el !== view) {
        root.replaceChild(el, view);
        views[idx] = el;
      }
      KireiInstance.resetActive();

      // Send params as props
      if (route.params) {
        for (let key of Object.keys(route.params)) {
          el[key] = route.params[key];
        }
      }
    }

    this.route.value = matched[matched.length - 1];
  }
}
