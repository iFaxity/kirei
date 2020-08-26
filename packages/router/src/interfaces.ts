import type { KireiInstance, Ref, KireiElement } from '@kirei/element';
import type { Route, RouteOptions } from './route';

export interface RouterEngine {
  init(opts: RouterOptions): void;
  update(): Promise<void>|void;
  resolve(link: Link, append?: boolean): string;
  push(link: Link, append?: boolean): void;
  replace(link: Link, append?: boolean): void;
  register(instance: KireiInstance): void;
}

export interface LinkOptions {
  to?: string;
  name?: string;
  params?: object;
  query?: object;
}
export type Link = string|LinkOptions;

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
