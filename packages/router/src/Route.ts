import { FxElement } from '@kirei/element';
import { pathToRegexp, Key } from 'path-to-regexp';
const ROUTE_KEYS = [ 'path', 'slot', 'keepAlive', 'meta', 'name', 'redirect', 'caseSensitive' ];

export interface RouteOptions {
  path: string;
  element: typeof FxElement | string;
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
  private el: Element = null;
  private tag: string;

  params: Record<string|number, string>;
  readonly routes?: Route[];
  readonly path: string;
  readonly slot?: string;
  readonly keepAlive: boolean = true;
  readonly meta?: any;
  readonly name?: string;
  readonly redirect?: string | Function;
  readonly caseSensitive?: boolean;
  readonly aliases?: string[];

  constructor(opts: RouteOptions) {
    for (const [ key, value ] of Object.entries(opts)) {
      if (ROUTE_KEYS.includes(key)) {
        this[key] = value;
      }
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

    if (typeof opts.element == 'function') {
      this.tag = opts.element.is;
    } else if (typeof opts.element == 'string') {
      this.tag = opts.element;
    } else {
      throw new TypeError('Element is not of a valid type');
    }
  }

  match(path: string): boolean {
    const { keys } = this;

    // Required for subroutes '/ to work
    // Not a problem as it's ignored by the regex anyways
    if (this.routes.length == 0 && !path.endsWith('/')) {
      path += '/';
    }

    const res = this.regex.exec(path);
    if (res) {
      if (keys.length) {
        this.params = keys.reduce((acc, key, idx) => {
          acc[key] = res[1 + idx];
          return acc;
        }, {});
      }
    }

    return !!res;
  }

  get element(): Element {
    const el = this.el ?? document.createElement(this.tag) as Element;
    if (this.slot) {
      el.slot = this.slot;
    }
    if (this.keepAlive) {
      this.el = el;
    }

    return el;
  }
}
