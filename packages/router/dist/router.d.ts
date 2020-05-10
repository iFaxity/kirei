import { KireiInstance, Ref } from '@kirei/element';
import { Route, RouteOptions } from './route';
export declare type Link = string | LinkOptions;
export interface LinkOptions {
    to?: string;
    name?: string;
    params?: object;
    query?: object;
}
export interface RouterOptions {
    history?: boolean;
    base?: string;
    exactClass?: string;
    activeClass?: string;
    routes: RouteOptions[];
}
export interface RouterInterface {
    resolve(link: Link, append?: boolean): string;
    push(link: Link, append?: boolean): void;
    replace(link: Link, append?: boolean): void;
    attach(instance: KireiInstance): void;
    detach(instance: KireiInstance): void;
}
export declare enum RouterHooks {
    ENTER = "enter",
    UPDATE = "update",
    LEAVE = "leave",
    BEFORE_EACH = "beforeEach",
    AFTER_EACH = "afterEach"
}
export declare type RouterHook = (to: Route, from: Route) => void | Promise<void>;
export declare class Router {
    private afterHooks;
    private beforeHooks;
    protected readonly routes: Route[];
    protected readonly instances: KireiInstance[];
    readonly path: Ref<string>;
    readonly route: Ref<Route>;
    base: string;
    exactClass: string;
    activeClass: string;
    constructor(opts: RouterOptions);
    beforeEach(hook: RouterHook): void;
    afterEach(hook: RouterHook): void;
    resolve(link: Link, append?: boolean): string;
    protected matchRoutes(): Route[];
}
//# sourceMappingURL=router.d.ts.map