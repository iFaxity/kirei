import { pathToRegexp, Key } from 'path-to-regexp';
import { FxElement } from '@shlim/element';
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
}

export class Route {
  private readonly regex: RegExp;
  private readonly keys: (string | number)[];
  private $el: Element = null;
  private tagName: string;

  params: Record<string|number, string>;
  readonly routes?: Route[];
  readonly path: string;
  readonly slot?: string;
  readonly keepAlive: boolean = true;
  readonly meta?: any;
  readonly name?: string;
  readonly redirect?: string | Function;
  readonly caseSensitive?: boolean;

  constructor(opts: RouteOptions) {
    for (const [ key, value ] of Object.entries(opts)) {
      if (ROUTE_KEYS.includes(key)) {
        this[key] = value;
      }
    }

    // Map the routes and compile the regex
    const routes = opts.routes?.map(o => {
      o.path = opts.path + o.path;
      return new Route(o);
    });
    this.routes = routes ?? [];

    const keys: Key[] = [];
    this.regex = pathToRegexp(this.path, keys, {
      end: this.routes.length == 0,
    });
    this.keys = keys.map(key => key.name);

    if (typeof opts.element == 'function') {
      this.tagName = opts.element.is;
    } else if (typeof opts.element == 'string') {
      this.tagName = opts.element;
    } else {
      throw new TypeError('Element is not of a valid type');
    }
  }

  match(path: string): boolean {
    const res = this.regex.exec(path);

    if (res && this.keys.length) {
      this.params = this.keys.reduce((acc, key, idx) => {
        acc[key] = res[1 + idx];
        return acc;
      }, {});
    }

    return !!res;
  }

  createElement(): Element {
    let $el = this.$el ?? document.createElement(this.tagName);

    if (this.slot) {
      $el.slot = this.slot;
    }
    if (this.keepAlive) {
      this.$el = $el;
    }

    return $el;
  }

  /*renderTo(root: Element): void {
    const $ctx = root.lastElementChild;

    if (!this.keepAlive || !this.$el) {
      this.$el = document.createElement(this.tagName);

      if (this.slot) {
        this.$el.slot = this.slot;
      }
    }

    // Append or replace element
    if (!$ctx) {
      root.appendChild(this.$el);
    } else if (this.$el != $ctx) {
      root.replaceChild(this.$el, $ctx);
    }

    // Send params as props
    if (this.params) {
      for (let key of Object.keys(this.params)) {
        this.$el[key] = this.params[key];
      }
    }
  }*/
}
