import { onUnmount, FxInstance, onMount, defineHook } from '@kirei/element';
import { IS_BROWSER } from '@kirei/shared';
import { RouterOptions, Router, RouterHook, RouterInterface } from './router';
import { ClientRouter } from './client';
//import { ServerRouter } from './lib/server';

export let router: Router & RouterInterface;
export function createRouter(opts: RouterOptions): Router {
  //router = IS_BROWSER ? new ClientRouter(opts) : new ServerRouter(opts);
  router = new ClientRouter(opts);
  return router;
}

// routerView plugin
export function routerView() {
  const instance = FxInstance.active;
  onMount(() => router.attach(instance));
  onUnmount(() => router.detach(instance));
}

// Instance lifecycle hooks
export const onRouteEnter = defineHook<RouterHook>('routeEnter');
export const onRouteUpdate = defineHook<RouterHook>('routeUpdate');
export const onRouteLeave = defineHook<RouterHook>('routeLeave');
