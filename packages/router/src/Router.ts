import { LinkOptions } from './link';
import { Route, RouteOptions } from './Route';

const history = window.history;
const SUPPORTS_HISTORY = !!(history && history.pushState);

export interface RouterOptions {
  history?: boolean;
  base?: string;
  exactClass?: string;
  activeClass?: string;
  routes: RouteOptions[];
}

export class Router {
  readonly history: boolean;
  readonly base: string;
  readonly routes: Route[];
  // Set of view and the rendered element
  private views: Element[] = [];
  private viewCtx: Node[] = [];
  // Current route
  private route: Route = null;

  readonly exactClass: string;
  readonly activeClass: string;

  constructor(opts: RouterOptions) {
    // Force hash mode if HistoryAPI not supported
    this.history = SUPPORTS_HISTORY && (opts.history ? !!opts.history : true);
    this.base = typeof opts.base == 'string' ? opts.base : '/';
    this.routes = opts.routes.map(o => new Route(o));
    this.exactClass = opts.exactClass ?? 'link-exact';
    this.activeClass = opts.activeClass ?? 'link-active';

    // Start router
    const navigate = this.navigate.bind(this);
    const eventName = this.history ? 'popstate' : 'hashchange';
    window.addEventListener(eventName, navigate, false);

    // Do the initial navigation after content has loaded
    window.addEventListener('DOMContentLoaded', navigate);
  }

  get path() {
    return this.history ? location.pathname : location.hash.slice(1);
  }

  register($el: Element): void {
    this.views.push($el);
    this.viewCtx.push(document.createComment(''));
  }

  unregister($el: Element): void {
    const idx = this.views.indexOf($el);
    this.views.splice(idx, 1);
    this.viewCtx.splice(idx, 1);
  }

  push(path: string|LinkOptions): boolean {
    if (this.history) {
      history.pushState(null, null, this.base + path);
    } else {
      location.hash = this.base + path;
    }

    return this.navigate();
  }

  replace(path: string|LinkOptions): boolean {
    if (this.history) {
      history.replaceState(null, null, this.base + path);
    } else {
      location.hash = this.base + path;
    }

    return this.navigate();
  }

  // TODO keep track of rendered elements
  private renderRoute(route: Route, $view: Element): void {
    const $el = route.createElement();
    const $ctx = $view.firstElementChild;

    // Append or replace element
    if (!$ctx) {
      $view.appendChild($el);
    } else if ($el != $ctx) {
      $view.replaceChild($el, $ctx);
    }

    // Send params as props
    if (route.params) {
      for (let [ key, value ] of Object.entries(route.params)) {
        $el[key] = value;
      }
    }
  }

  // Navigates to path
  private navigate(): boolean {
    const { path } = this;
    let routes = this.routes;

    if (this.route?.path === path || !path.startsWith(this.base)) {
      return false;
    }

    const relPath = path.substring(this.base.length);
    for (const $view of this.views) {
      const route = routes.find(r => r.match(relPath));

      if (route) {
        this.route = route;
        this.renderRoute(route, $view);

        if (route.routes) {
          routes = route.routes;
        } else {
          return true;
        }
      }
    }

    return true;
  }
}
