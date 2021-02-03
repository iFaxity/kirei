import { RouteLocationRaw, RouteRecordName } from './types';

export function isRouteLocation(route: any): route is RouteLocationRaw {
  const type = typeof route;
  return type == 'string' || (route && route == 'object');
}

export function isRouteName(name: any): name is RouteRecordName {
  const type = typeof name;
  return type == 'string' || type == 'symbol';
}

export const isBrowser = typeof window != 'undefined';
