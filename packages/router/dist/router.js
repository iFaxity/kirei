"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("@kirei/element");
const route_1 = require("./route");
var RouterHooks;
(function (RouterHooks) {
    RouterHooks["ENTER"] = "enter";
    RouterHooks["UPDATE"] = "update";
    RouterHooks["LEAVE"] = "leave";
    RouterHooks["BEFORE_EACH"] = "beforeEach";
    RouterHooks["AFTER_EACH"] = "afterEach";
})(RouterHooks = exports.RouterHooks || (exports.RouterHooks = {}));
class Router {
    constructor(opts) {
        var _a, _b, _c;
        this.afterHooks = new WeakSet();
        this.beforeHooks = new WeakSet();
        this.instances = [];
        this.base = '';
        this.exactClass = 'link-exact';
        this.activeClass = 'link-active';
        this.base = (_a = opts.base) !== null && _a !== void 0 ? _a : this.base;
        this.exactClass = (_b = opts.exactClass) !== null && _b !== void 0 ? _b : this.exactClass;
        this.activeClass = (_c = opts.activeClass) !== null && _c !== void 0 ? _c : this.activeClass;
        this.routes = opts.routes.map(o => new route_1.Route(o));
        this.path = element_1.ref('');
        this.route = element_1.ref(null);
    }
    /*protected runHooks(before: boolean, to: Route, from: Route)
  
    /*protected runInstanceHook(name: RouterHooks, to: Route, from: Route): Promise<void>[] {
      const promises: Promise<void>[] = [];
      const next = () => {};
  
      for (let instance of this.instances) {
        instance.runHooks(`route${name}`, to, from, next);
        // after?
      }
  
      return promises;
    }*/
    beforeEach(hook) {
        this.beforeHooks.add(hook);
    }
    afterEach(hook) {
        this.afterHooks.add(hook);
    }
    resolve(link, append) {
        var _a, _b;
        let path;
        if (typeof link == 'string') {
            path = link;
        }
        else {
            path = (_b = (link.name
                ? (_a = this.routes.find(r => r.name === link.name)) === null || _a === void 0 ? void 0 : _a.path : link === null || link === void 0 ? void 0 : link.to)) !== null && _b !== void 0 ? _b : '';
            // Stringify the query object
            if (link.query) {
                const query = Object.keys(link.query).reduce((acc, key) => {
                    const value = link.query[key];
                    return acc += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
                }, '');
                path += `?${query.substring(0, query.length - 1)}`;
            }
        }
        return this.base + (append ? this.path + path : path);
    }
    matchRoutes() {
        let { base, routes } = this;
        const route = this.route.value;
        const path = this.path.value;
        if ((route === null || route === void 0 ? void 0 : route.path) === path) {
            return null;
        }
        const matched = [];
        const relative = path.substring(base.length);
        // Go down the routing tree
        while (true) {
            const route = routes.find(r => r.match(relative));
            if (!route) {
                break;
            }
            matched.push(route);
            if (route.routes) {
                routes = route.routes;
            }
            else {
                break;
            }
        }
        return matched;
    }
}
exports.Router = Router;
//# sourceMappingURL=router.js.map