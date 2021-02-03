import { defineHook, inject, InjectionKey, unref, computed, UnwrapNestedRefs } from '@kirei/element';
import { RouteLocationNormalizedLoaded } from './type';
import { Router, NavigationFailure, RouteLocationRaw, RouteRecord } from './types';

const ROUTER_KEY: InjectionKey<Router> = Symbol('routerKey');
const ROUTE_KEY: InjectionKey<RouteLocationNormalizedLoaded> = Symbol('routeKey');

// Hooks
export const onBeforeRouteLeave = defineHook('beforeRouteLeave');
export const onBeforeRouteUpdate = defineHook('beforeRouteUpdate');

// Coposition API methods

// ShouldRoute
function guardEvent(e: MouseEvent = {} as MouseEvent): boolean {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
  // don't redirect when preventDefault called
  if (e.defaultPrevented) return;
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return;
  // don't redirect if `target="_blank"`
  // @ts-ignore getAttribute does exist
  if (e.currentTarget && e.currentTarget.getAttribute) {
    // @ts-ignore getAttribute exists
    const target = e.currentTarget.getAttribute('target');
    if (/\b_blank\b/i.test(target)) return;
  }

  e.preventDefault();
  return true;
}

export interface RouterLinkProps {
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

export type RouterLinkOptions = UnwrapNestedRefs<RouterLinkProps>;



// TODO: we could allow currentRoute as a prop to expose `isActive` and
// `isExactActive` behavior should go through an RFC
export function useLink(props: RouterLinkOptions) {
  const router = useRouter();
  const currentRoute = useRoute();
  const route = computed(() => router.resolve(unref(props.to)))

  const activeRecordIndex = computed<number>(() => {
    let { matched } = route.value;
    let { length } = matched;
    const routeMatched: RouteRecord | undefined = matched[length - 1];
    const currentMatched = currentRoute.matched;
    if (!routeMatched || !currentMatched.length) {
      return -1;
    }

    const index = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
    if (index > -1) {
      return index;
    }

    // possible parent record
    let parentRecordPath = getOriginalPath(matched[length - 2] as RouteRecord | undefined);
    return (
      // we are dealing with nested routes
      length > 1 &&
        // if the parent and matched route have the same path, this link is
        // referring to the empty child. Or we currently are on a different
        // child of the same parent
        getOriginalPath(routeMatched) === parentRecordPath &&
        // avoid comparing the child with its parent
        currentMatched[currentMatched.length - 1].path !== parentRecordPath
        ? currentMatched.findIndex(
            isSameRouteRecord.bind(null, matched[length - 2])
          )
        : index
    );
  })

  const isActive = computed<boolean>(
    () => activeRecordIndex.value > -1 &&
      includesParams(currentRoute.params, route.value.params)
  );
  const isExactActive = computed<boolean>(
    () => activeRecordIndex.value > -1 &&
      activeRecordIndex.value === currentRoute.matched.length - 1 &&
      isSameRouteLocationParams(currentRoute.params, route.value.params)
  );

  async function navigate(e?: MouseEvent): Promise<void | NavigationFailure> {
    if (e != null) {
      // don't redirect with control keys
      if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
      // don't redirect when preventDefault called
      if (e.defaultPrevented) return;
      // don't redirect on right click
      if (e.button !== undefined && e.button !== 0) return;
      // don't redirect if `target="_blank"`
      // @ts-ignore getAttribute does exist
      if (e.currentTarget && e.currentTarget.getAttribute) {
        // @ts-ignore getAttribute exists
        const target = e.currentTarget.getAttribute('target');
        if (/\b_blank\b/i.test(target)) return;
      }

      e.preventDefault();
    }

    return router[unref(props.replace) ? 'replace' : 'push'](unref(props.to));
  }

  return {
    route,
    href: computed(() => route.value.href),
    isActive,
    isExactActive,
    navigate,
  };
}

/**
 * Returns the router instance. Equivalent to using `$router` inside
 * templates.
 */
export function useRouter(): Router {
  return inject(ROUTER_KEY);
}

/**
 * Returns the current route location. Equivalent to using `$route` inside
 * templates.
 */
export function useRoute(): RouteLocationNormalizedLoaded {
  return inject(ROUTE_KEY);
}
