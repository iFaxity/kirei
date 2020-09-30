import { KireiInstance, directive, watchEffect, HookTypes } from '@kirei/element';
import { Link, RouterOptions, IRouter, Router, ROUTER_KEY, ROUTE_KEY } from './router';
import { Route } from './route';
const SUPPORTS_HISTORY = !!(window.history?.pushState);

export class ClientRouter extends Router implements IRouter {
  private views: Node[] = [];
  readonly history: boolean;

  private get currentPath(): string {
    return this.history ? location.pathname : location.hash.slice(1);
  }

  constructor(opts: RouterOptions) {
    super(opts);
    // Force hash mode if HistoryAPI not supported
    this.history = SUPPORTS_HISTORY && (opts.history !== false);
    this.path = this.currentPath;

    // Mount root as view and provide route and router as state
    // TODO: Inject global hook instead?
    const loadRouter = () => {
      const root = KireiInstance.get(this.root);
      root.provide(ROUTER_KEY, this);
      root.provide(ROUTE_KEY, this.route);
      this.mountView(root);
      this.registerView(root);
      navigate();
    };

    // Watch for changes to location state
    const navigate = () => this.navigate();
    window.addEventListener(this.history ? 'popstate' : 'hashchange', navigate, false);
    window.addEventListener('DOMContentLoaded', loadRouter, false);

    // Add link directive
    directive('link', dir => {
      const { el, mods } = dir;
      const replace = mods.includes('replace');
      const append = mods.includes('append');
      const exact = mods.includes('exact');
      let link: Link;
      let linkpath: string;

      // hook into router and watch for route changes
      watchEffect(() => {
        //const route = this.route.value;
        const isActive = this.path.startsWith(linkpath);
        const isExact = isActive && exact && linkpath === this.path;

        el.classList[isActive ? 'add' : 'remove'](this.activeClass);
        el.classList[isExact ? 'add' : 'remove'](this.exactClass);
      });

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

  private mountView(instance: KireiInstance) {
    const { views, instances } = this;

    // Comment node is used to mark the node reference
    const ref = document.createComment('');
    instance.el.appendChild(ref);
    instances.push(instance);
    views.push(ref);
  }

  private unmountView(instance: KireiInstance) {
    const { views, instances } = this;
    const idx = instances.indexOf(instance);
    instances.splice(idx, 1);
    views.splice(idx, 1);
  }

  registerView(instance: KireiInstance): void {
    instance.injectHook(HookTypes.BEFORE_MOUNT, this.mountView.bind(this, instance));
    instance.injectHook(HookTypes.BEFORE_UNMOUNT, this.unmountView.bind(this, instance));
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

  async renderView(matched: Route[], idx: number) {
    const { views, instances } = this;
    const instance = instances[idx];
    const route = matched[idx];
    const view = views[idx];
    const root = instance.el;

    // Replace node if view elements are not the same
    instance.activate();

    // Just a boolean indicating if it has an element cached
    const register = !route.context;
    const el = await route.element();
    if (el !== view) {
      if (register) {
        this.registerView(KireiInstance.get(el));
      }

      root.replaceChild(el, view);
      views[idx] = el;
    }

    if (matched.length > ++idx) {
      await this.renderView(matched, idx);
    }
    instance.deactivate();
  }

  protected async navigate(): Promise<void> {
    this.path = this.currentPath;

    const matched = this.matchRoutes();
    if (matched) {
      this.route.value = matched[matched.length - 1];
      await this.renderView(matched, 0);
    }
  }
}
