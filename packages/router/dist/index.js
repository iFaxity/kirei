"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("@kirei/element");
const client_1 = require("./client");
function createRouter(opts) {
    //router = IS_BROWSER ? new ClientRouter(opts) : new ServerRouter(opts);
    exports.router = new client_1.ClientRouter(opts);
    return exports.router;
}
exports.createRouter = createRouter;
// routerView plugin
function routerView() {
    const instance = element_1.KireiInstance.active;
    element_1.onMount(() => exports.router.attach(instance));
    element_1.onUnmount(() => exports.router.detach(instance));
}
exports.routerView = routerView;
// Instance lifecycle hooks
exports.onRouteEnter = element_1.defineHook('routeEnter');
exports.onRouteUpdate = element_1.defineHook('routeUpdate');
exports.onRouteLeave = element_1.defineHook('routeLeave');
//# sourceMappingURL=index.js.map