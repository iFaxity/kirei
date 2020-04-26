/*import { FxInstance } from '@kirei/element';
import {
  Link,
  RouterOptions,
  Router,
} from './router';
import { Route } from './route';

export class ServerRouter implements Router {
  readonly routes: Route[] = [];
  readonly views: ([Node, Node])[] = [];
  readonly history: boolean;
  base: string = '';
  exactClass: string = 'link-exact';
  activeClass: string = 'link-active';
  route: Route;

  get path(): string {
    return this.history ? location.pathname : location.hash.slice(1);
  }

  constructor(opts: RouterOptions) {}

  // Resolves a path from a named route or the route itself
  resolve(link: Link, append?: boolean) {
    return resolve(this, link, append);
  }

  attach(instance: FxInstance): void {}

  detach(instance: FxInstance): void {}

  push(link: Link, append: boolean) {
    const path = resolve(this, link, append);
    return this.navigate();
  }

  replace(link: Link, append: boolean) {
    const path = resolve(this, link, append);
    return this.navigate();
  }

  protected navigate(): boolean {
    const matched = navigate(this);
    if (matched == null) return false;

    for (let idx = 0; idx < matched.length; idx++) {
      const route = matched[idx];
      const [ view, node ] = this.views[idx];

      // Send params as props
      if (route.params) {
        for (const key of Object.keys(route.params)) {}
      }
    }

    return true;
  }
}*/
