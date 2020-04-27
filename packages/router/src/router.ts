import { KireiInstance, ref, Ref } from '@kirei/element';
import { Route, RouteOptions } from './route';

export type Link = string|LinkOptions;
export interface LinkOptions {
  to?: string;
  name?: string;
  params?: object;
  query?: object;
}

export interface RouterOptions {
  history?: boolean;
  base?: string;
  exactClass?: string;
  activeClass?: string;
  routes: RouteOptions[];
}

export interface RouterInterface {
  resolve(link: Link, append?: boolean): string;
  push(link: Link, append?: boolean): boolean;
  replace(link: Link, append?: boolean): boolean;
  attach(instance: KireiInstance): void;
  detach(instance: KireiInstance): void;
}

export enum RouterHooks {
  ENTER = 'enter',
  UPDATE = 'update',
  LEAVE = 'leave',
  BEFORE_EACH = 'beforeEach',
  AFTER_EACH = 'afterEach',
}

export type RouterHook = (to: Route, from: Route) => void|Promise<void>;
export class Router {
  private afterHooks = new WeakSet<Function>();
  private beforeHooks = new WeakSet<Function>();
  protected readonly routes: Route[];
  protected readonly instances: KireiInstance[] = [];

  readonly path: Ref<string>;
  readonly route: Ref<Route>;
  base: string = '';
  exactClass: string = 'link-exact';
  activeClass: string = 'link-active';

  constructor(opts: RouterOptions) {
    this.base = opts.base ?? this.base;
    this.exactClass = opts.exactClass ?? this.exactClass;
    this.activeClass = opts.activeClass ?? this.activeClass;
    this.routes = opts.routes.map(o => new Route(o));
    this.path = ref('');
    this.route = ref(null);
  }

  /*protected runHooks(before: boolean, to: Route, from: Route)

  /*protected runInstanceHook(name: RouterHooks, to: Route, from: Route): Promise<void>[] {
    const promises: Promise<void>[] = [];
    const next = () => {};

    for (let instance of this.instances) {
      instance.runHooks(`route${name}`, to, from, next);
      // after?
    }

    return promises;
  }*/

  beforeEach(hook: RouterHook): void {
    this.beforeHooks.add(hook);
  }
  afterEach(hook: RouterHook): void {
    this.afterHooks.add(hook);
  }

  resolve(link: Link, append?: boolean) {
    let path: string;

    if (typeof link == 'string') {
      path = link;
    } else {
      path = (link.name
        ? this.routes.find(r => r.name === link.name)?.path
        : link?.to) ?? '';

      // Stringify the query object
      if (link.query) {
        const query = Object.keys(link.query).reduce((acc, key) => {
          const value = link.query[key];
          return acc += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
        }, '');
        path += `?${query.substring(0, query.length - 1)}`;
      }
    }
  
    return this.base + (append ? this.path + path : path);
  }

  protected matchRoutes(): Route[] {
    let { base, routes } = this;
    const route = this.route.value;
    const path = this.path.value;

    if (route?.path === path) {
      return null;
    }

    const matched: Route[] = [];
    const relative = path.substring(base.length);

    // Go down the routing tree
    while (true) {
      const route = routes.find(r => r.match(relative));
      if (!route) {
        break;
      }

      matched.push(route);
      if (route.routes) {
        routes = route.routes;
      } else {
        break;
      }
    }

    return matched;
  }
}
