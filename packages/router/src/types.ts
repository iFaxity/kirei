import type { Ref, ComputedRef, Component } from '@kirei/element';

export declare function createRouter(options: RouterOptions): Router;
export declare function createWebHistory(base?: string): RouterHistory;
export declare function createWebHashHistory(base?: string): RouterHistory;
export declare function createMemoryHistory(base?: string): RouterHistory;

// pushState clones the state passed and do not accept everything
// it doesn't accept symbols, nor functions as values. It also ignores Symbols as keys
type HistoryStateValue = string|number|boolean|null|undefined|HistoryState|HistoryStateArray;

export interface HistoryState {
  [x: number]: HistoryStateValue;
  [x: string]: HistoryStateValue;
}
interface HistoryStateArray extends Array<HistoryStateValue> {}

export enum NavigationType {
  pop = 'pop',
  push = 'push',
}

export enum NavigationDirection {
  back = 'back',
  forward = 'forward',
  unknown = '',
}

export interface NavigationInformation {
  type: NavigationType;
  direction: NavigationDirection;
  delta: number;
}

export interface NavigationCallback {
  (to: string, from: string, information: NavigationInformation): void;
}

/**
 * Interface implemented by History implementations that can be passed to the
 * router as {@link Router.history}
 *
 * @alpha
 */
export interface RouterHistory {
  /**
   * Base path that is prepended to every url. This allows hosting an SPA at a
   * subfolder of a domain like `example.com/subfolder` by having a `base` of
   * `/subfolder`
   */
  readonly base: string;
  /**
   * Current History location
   */
  readonly location: string;
  /**
   * Current History state
   */
  readonly state: HistoryState;

  /**
   * Navigates to a location. In the case of an HTML5 History implementation,
   * this will call `history.pushState` to effectively change the URL.
   *
   * @param to - location to push
   * @param data - optional {@link HistoryState} to be associated with the
   * navigation entry
   */
  push(to: string, data?: HistoryState): void;
  /**
   * Same as {@link RouterHistory.push} but performs a `history.replaceState`
   * instead of `history.pushState`
   *
   * @param to - location to set
   * @param data - optional {@link HistoryState} to be associated with the
   * navigation entry
   */
  replace(to: string, data?: HistoryState): void;

  /**
   * Traverses history in a given direction.
   *
   * @example
   * ```js
   * myHistory.go(-1) // equivalent to window.history.back()
   * myHistory.go(1) // equivalent to window.history.forward()
   * ```
   *
   * @param delta - distance to travel. If delta is \< 0, it will go back,
   * if it's \> 0, it will go forward by that amount of entries.
   * @param triggerListeners - whether this should trigger listeners attached to
   * the history
   */
  go(delta: number, triggerListeners?: boolean): void;

  /**
   * Attach a listener to the History implementation that is triggered when the
   * navigation is triggered from outside (like the Browser back and forward
   * buttons) or when passing `true` to {@link RouterHistory.back} and
   * {@link RouterHistory.forward}
   *
   * @param callback - listener to attach
   * @returns a callback to remove the listener
   */
  listen(callback: NavigationCallback): () => void;

  /**
   * Generates the corresponding href to be used in an anchor tag.
   *
   * @param location - history location that should create an href
   */
  createHref(location: string): string;

  /**
   * Clears any event listener attached by the history implementation.
   */
  destroy(): void;
}

export declare const START_LOCATION: RouteLocationNormalized;

export declare function onBeforeRouteLeave(leaveGuard: NavigationGuard): void;
export declare function onBeforeRouteUpdate(updateGuard: NavigationGuard): void;

/**
 * Used to add meta fields to every route
 */
export interface RouteMeta extends Record<RouteRecordName | number, any> {}
export type RouteRecordName = string | symbol;

export interface NavigationHookAfter {
  (to: RouteLocationNormalized, from: RouteLocationNormalized,
    // TODO: move these types to a different file
    failure?: NavigationFailure | void): any;
}


export interface RouterLinkOptions {
  /**
   * Route Location the link should navigate to when clicked on.
   */
  to: RouteLocationRaw;
  /**
   * Calls `router.replace` instead of `router.push`.
   */
  replace?: boolean;
  // TODO: refactor using extra options allowed in router.push. Needs RFC
}

export declare function useLink(props: RouterLinkOptions): {
  route: ComputedRef<RouteLocationNormalized & { href: string }>;
  href: ComputedRef<string>;
  isActive: ComputedRef<boolean>;
  isExactActive: ComputedRef<boolean>;
  navigate(event?: MouseEvent): Promise<NavigationFailure | void>;
};

export declare function useRoute(): RouteLocationNormalized;
export declare function useRouter(): Router;

export interface RouterOptions {
  history: RouterHistory;
  linkActiveClass?: string;
  linkExactActiveClass?: string;
  parseQuery?(searchQuery: string): Record<string, (string | null)[] | string | null>;
  routes: RouteRecordRaw[];
  scrollBehavior?: ScrollBehavior;
  stringifyQuery?(query: Record<string | number, string | number | null | undefined | (string | number | null | undefined)[]>): string;
}

export interface Router {
  readonly currentRoute: Ref<RouteLocationNormalized>;
  readonly options: RouterOptions;

  addRoute(route: RouteRecordRaw): void;
  addRoute(parentName: RouteRecordName, route: RouteRecordRaw): void;

  afterEach(guard: NavigationHookAfter): void;
  back(): void;
  beforeEach(guard: NavigationGuard): void;
  beforeResolve(guard: NavigationGuard): void;
  forward(): void;
  getRoutes(): RouteRecordNormalized[];
  go(delta: number): void;
  hasRoute(name: RouteRecordName): boolean;
  isReady(): Promise<void>;
  onError(handler: (error: any) => any): void;
  push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
  removeRoute(name: RouteRecordName): void;
  replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
  resolve(to: RouteLocationRaw): RouteLocation & { href: string };
}

export interface RouteRecordRaw {
  path: string;
  redirect?: RouteLocationRaw | ((to: RouteLocationNormalized) => RouteLocationRaw);
  children?: RouteRecordRaw[];
  alias?: string | string[];
  name?: RouteRecordName;
  beforeEnter?: NavigationGuard | NavigationGuard[];
  props?: boolean | Record<string, any> | ((to: RouteLocationNormalized) => Record<string, any>);
  meta?: RouteMeta;
}

export interface RouteRecordNormalized {
  aliasOf?: RouteRecordNormalized;
  beforeEnter?: NavigationGuard;
  children: RouteRecordNormalized;
  elements: Record<string, Component>;
  meta: RouteMeta;
  name?: RouteRecordName;
  path: string;
  props: Record<string, boolean | Function | Record<string, any>>;
  redirect?: RouteLocationRaw;
}

export type RouteLocationRaw = string | {
  path?: string;
  hash?: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
  replace?: boolean;
}

export type RouteLocation = RouteLocationRaw | {
  redirect?: RouteLocationRaw | ((to: RouteLocationNormalized) => RouteLocationRaw);
}

export interface RouteLocationNormalized {
  fullPath: string;
  hash: string;
  query: Record<string, string | string[]>;
  matched: RouteRecordNormalized[];
  meta: RouteMeta;
  name?: RouteRecordName | null;
  params: Record<string, string | string[]>;
  path: string;
  redirectedFrom?: RouteLocation;
}

export enum NavigationFailureType {
  aborted = 4,
  cancelled = 8,
  duplicated = 16,
}

export interface NavigationFailure {
  from: RouteLocationNormalized;
  to: RouteLocationNormalized;
  type: NavigationFailureType;
}

export type NavigationGuard = (to: RouteLocationNormalized, from: RouteLocationNormalized, next?: Function) => void;
