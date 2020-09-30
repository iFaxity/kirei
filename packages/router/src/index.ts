import { defineHook } from '@kirei/element';
import { RouterOptions, Router, RouterHook } from './router';
import { ClientRouter } from './client';
//import { Route } from './route';
//import { ServerRouter } from './server';

export { useRoute, useRouter } from './router';

export function createRouter(opts: RouterOptions): Router {
  //return __BROWSER__ ? new ClientRouter(opts) : new ServerRouter(opts);
  return new ClientRouter(opts);
}

// Instance lifecycle hooks
export const onRouteEnter = defineHook<RouterHook>('routeEnter');
export const onRouteUpdate = defineHook<RouterHook>('routeUpdate');
export const onRouteLeave = defineHook<RouterHook>('routeLeave');
