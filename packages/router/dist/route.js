"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
const path_to_regexp_1 = require("path-to-regexp");
const ROUTE_KEYS = ['path', 'slot', 'keepAlive', 'meta', 'name', 'redirect', 'caseSensitive'];
class Route {
    constructor(opts) {
        var _a, _b, _c;
        this.el = null;
        this.keepAlive = true;
        for (const key of Object.keys(opts)) {
            if (ROUTE_KEYS.includes(key)) {
                this[key] = opts[key];
            }
        }
        // Map the routes and compile the regex
        this.routes = (_b = (_a = opts.routes) === null || _a === void 0 ? void 0 : _a.map(o => {
            o.path = opts.path + o.path;
            return new Route(o);
        })) !== null && _b !== void 0 ? _b : [];
        const keys = [];
        this.regex = path_to_regexp_1.pathToRegexp(this.path, keys, {
            end: !this.routes.length,
            sensitive: this.caseSensitive,
        });
        this.keys = keys.map(key => key.name);
        if (typeof opts.element == 'string') {
            this.ctor = opts.element;
        }
        else if (shared_1.isFunction(opts.element) || shared_1.isFunction((_c = opts === null || opts === void 0 ? void 0 : opts.element) === null || _c === void 0 ? void 0 : _c.then)) {
            this.ctor = opts.element;
        }
        else {
            throw new TypeError('Element is not of a valid type');
        }
    }
    match(path) {
        const { keys } = this;
        // Required for subroutes '/ to work
        // Not a problem as it's ignored by the regex anyways
        if (this.routes.length == 0 && !path.endsWith('/')) {
            path += '/';
        }
        const res = this.regex.exec(path);
        if (res) {
            if (keys.length) {
                this.params = keys.reduce((acc, key, idx) => {
                    acc[key] = res[1 + idx];
                    return acc;
                }, {});
            }
        }
        return !!res;
    }
    async element() {
        let { el } = this;
        if (!this.el) {
            if (typeof this.ctor == 'string') {
                el = document.createElement(this.ctor);
            }
            else {
                el = new (await this.ctor)();
            }
        }
        if (this.slot) {
            el.slot = this.slot;
        }
        if (this.keepAlive) {
            this.el = el;
        }
        return el;
    }
}
exports.Route = Route;
//# sourceMappingURL=route.js.map