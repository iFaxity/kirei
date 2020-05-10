"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("@kirei/element");
const router_1 = require("./router");
const SUPPORTS_HISTORY = !!((_a = window.history) === null || _a === void 0 ? void 0 : _a.pushState);
class ClientRouter extends router_1.Router {
    /*get path(): string {
      return this.history ? location.pathname : location.hash.slice(1);
    }*/
    constructor(opts) {
        super(opts);
        this.views = [];
        // Force hash mode if HistoryAPI not supported
        this.history = SUPPORTS_HISTORY && (opts.history !== false);
        this.path.value = this.history ? location.pathname : location.hash.slice(1);
        // Watch for changes to location state
        const navigate = () => this.navigate();
        window.addEventListener(this.history ? 'popstate' : 'hashchange', navigate, false);
        window.addEventListener('DOMContentLoaded', navigate, false);
        // Add link directive
        element_1.directive('link', dir => {
            const { el, mods } = dir;
            const replace = mods.includes('replace');
            const append = mods.includes('append');
            const exact = mods.includes('exact');
            let link;
            let linkpath;
            const commit = (path) => {
                let isActive = path.startsWith(linkpath);
                const isExact = isActive && exact && linkpath === path;
                el.classList[isActive ? 'add' : 'remove'](this.activeClass);
                el.classList[isExact ? 'add' : 'remove'](this.exactClass);
            };
            element_1.watchFx(() => commit(this.path.value));
            // Navigates the route
            el.addEventListener('click', e => {
                e.preventDefault();
                this[replace ? 'replace' : 'push'](link, append);
            });
            return (pending) => {
                if (pending === link && !append)
                    return;
                linkpath = this.resolve(pending, append);
                link = pending;
                // Anchor tags requires a href attribute
                if (el.localName == 'a') {
                    el.setAttribute('href', this.history ? linkpath : `#${linkpath}`);
                }
            };
        });
    }
    attach(instance) {
        const { views, instances } = this;
        // Comment node is used to mark the node reference
        const ref = document.createComment('');
        instance.el.appendChild(ref);
        instances.push(instance);
        views.push(ref);
    }
    detach(instance) {
        const { views, instances } = this;
        const idx = instances.indexOf(instance);
        instances.splice(idx, 1);
        views.splice(idx, 1);
    }
    push(link, append) {
        const path = this.resolve(link, append);
        if (this.history) {
            history.pushState(null, null, path);
        }
        else {
            location.hash = path;
        }
        this.navigate();
    }
    replace(link, append) {
        const path = this.resolve(link, append);
        if (this.history) {
            history.replaceState(null, null, path);
        }
        else {
            location.hash = path;
        }
        this.navigate();
    }
    async navigate() {
        this.path.value = this.history ? location.pathname : location.hash.slice(1);
        const matched = this.matchRoutes();
        if (matched == null)
            return;
        const { views, instances } = this;
        for (let idx = 0; idx < matched.length; idx++) {
            const instance = instances[idx];
            const route = matched[idx];
            const root = instance.el;
            const view = views[idx];
            // Replace node if view elements are not the same
            element_1.KireiInstance.active = instance;
            const el = await route.element();
            if (el !== view) {
                root.replaceChild(el, view);
                views[idx] = el;
            }
            element_1.KireiInstance.resetActive();
            // Send params as props
            if (route.params) {
                for (let key of Object.keys(route.params)) {
                    el[key] = route.params[key];
                }
            }
        }
        this.route.value = matched[matched.length - 1];
    }
}
exports.ClientRouter = ClientRouter;
//# sourceMappingURL=client.js.map