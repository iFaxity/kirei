import { RouterOptions, Router, RouterHook, RouterInterface } from './router';
export declare let router: Router & RouterInterface;
export declare function createRouter(opts: RouterOptions): Router;
export declare function routerView(): void;
export declare const onRouteEnter: (hook: RouterHook) => void;
export declare const onRouteUpdate: (hook: RouterHook) => void;
export declare const onRouteLeave: (hook: RouterHook) => void;
//# sourceMappingURL=index.d.ts.map