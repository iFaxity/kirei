import { Router, RouterOptions } from './Router';
export { routerView } from './link';

export function createRouter(opts: RouterOptions) {
  return new Router(opts);
}
