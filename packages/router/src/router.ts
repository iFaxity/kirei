import { KireiInstance, ref, Ref, KireiElement, inject } from '@kirei/element';
import { Route, RouteOptions } from './route';
import { isString } from '@kirei/shared';

// Route and router injection
export const ROUTER_KEY = Symbol('router');
export const ROUTE_KEY = Symbol('route');

export function useRoute(): Route {
  return inject<Ref<Route>>(ROUTE_KEY).value;
}
export function useRouter<T extends IRouter>(): T {
  return inject<Ref<T>>(ROUTER_KEY).value;
}

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
  root: KireiElement|string;
}

export interface IRouter {
  resolve(link: Link, append?: boolean): string;
  push(link: Link, append?: boolean): void;
  replace(link: Link, append?: boolean): void;
  registerView(instance: KireiInstance): void;
}

export enum RouterHooks {
  ENTER = 'routeEnter',
  UPDATE = 'routeUpdate',
  LEAVE = 'routeLeave',
  BEFORE_EACH = 'routeBeforeEach',
  AFTER_EACH = 'routeAfterEach',
}

export type RouterHook = (to: Route, from: Route) => void|Promise<void>;
export class Router {
  private afterHooks = new WeakSet<Function>();
  private beforeHooks = new WeakSet<Function>();
  protected readonly routes: Route[];
  protected instances: KireiInstance[] = [];

  readonly route: Ref<Route>;
  readonly root: KireiElement;
  base = '';
  exactClass = 'link-exact';
  activeClass = 'link-active';
  path = '';

  constructor(opts: RouterOptions) {
    this.base = opts.base ?? this.base;
    this.exactClass = opts.exactClass ?? this.exactClass;
    this.activeClass = opts.activeClass ?? this.activeClass;
    this.routes = opts.routes.map(o => new Route(o));
    this.route = ref(null);
    this.root = isString(opts.root) ? document.querySelector(opts.root) : opts.root;
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

  resolve(link: Link, append?: boolean): string {
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
    const { base, path } = this;
    const curRoute = this.route.value;
    if (curRoute?.path === path) {
      return null;
    }

    const matched: Route[] = [];
    const relative = path.substring(base.length);

    // Traverse route tree
    let { routes } = this;
    let route: Route;
    while (route = routes.find(r => r.match(relative))) {
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
