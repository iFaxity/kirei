import type { KireiElement, KireiInstance } from '@kirei/element';
import { isFunction, isPromise } from '@kirei/shared';
import { pathToRegexp, Key } from 'path-to-regexp';
const ROUTE_KEYS = [ 'path', 'slot', 'keepAlive', 'meta', 'name', 'redirect', 'caseSensitive' ];

export interface RouteOptions {
  path: string;
  element: typeof KireiElement | Promise<typeof KireiElement>;
  slot?: string;
  name?: string;
  meta?: any;
  keepAlive?: boolean;
  routes?: RouteOptions[];
  redirect?: string | Function;
  caseSensitive?: boolean;
  aliases?: string[];
}

export class Route {
  private readonly regex: RegExp;
  private readonly keys: (string | number)[];
  private readonly ctor: Promise<typeof KireiElement>;
  private el: KireiElement = null;

  readonly routes?: Route[];
  readonly path: string;
  readonly slot?: string;
  readonly keepAlive: boolean = true;
  readonly meta?: any;
  readonly name?: string;
  readonly redirect?: string | Function;
  readonly caseSensitive?: boolean;
  readonly aliases?: string[];
  params: Record<string|number, string>;

  constructor(opts: RouteOptions) {
    for (const key of Object.keys(opts).filter(key => ROUTE_KEYS.includes(key))) {
      this[key] = opts[key];
    }

    // Map the routes and compile the regex
    this.routes = opts.routes?.map(o => {
      o.path = opts.path + o.path;
      return new Route(o);
    }) ?? [];

    const keys: Key[] = [];
    this.regex = pathToRegexp(this.path, keys, {
      end: !this.routes.length,
      sensitive: this.caseSensitive,
    });
    this.keys = keys.map(key => key.name);

    if (isFunction(opts.element) || isPromise(opts.element)) {
      this.ctor = Promise.resolve(opts.element);
    } else {
      throw new TypeError('Element is not of a valid type');
    }
  }

  get context(): KireiElement {
    return this.el;
  }

  match(path: string): boolean {
    const { keys } = this;

    // Required for subroutes '/' to work
    // Not a problem as it's ignored by the regex anyways
    if (this.routes.length == 0 && !path.endsWith('/')) {
      path += '/';
    }

    const res = this.regex.exec(path);
    if (res && keys.length) {
      this.params = keys.reduce((acc, key, idx) => {
        acc[key] = res[1 + idx];
        return acc;
      }, {});
    }

    return !!res;
  }

  async element(): Promise<KireiElement> {
    let { el } = this;
    if (!el) {
      const Constructor = await this.ctor;
      el = new Constructor();

      if (this.keepAlive) {
        this.el = el;
      }
    }

    if (this.slot) {
      el.slot = this.slot;
    }

    return el;
  }
}
