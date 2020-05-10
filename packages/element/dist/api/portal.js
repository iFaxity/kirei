"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fx_1 = require("@kirei/fx");
const compiler_1 = require("../compiler");
const lifecycle_1 = require("./lifecycle");
const Queue = require("../queue");
const instance_1 = require("../instance");
const roots = new Map();
const portals = new WeakMap();
/**
 * Portals content to a element, useful for popups
 * @param {string} target Target element as querySelector string
 * @param {Function} template Template to render
 * @returns {void}
 */
function portal(target, templateFn) {
    const instance = instance_1.KireiInstance.active;
    let root = roots.get(target);
    if (!root) {
        roots.set(target, (root = document.querySelector(target)));
    }
    let portal = portals.get(root);
    if (!portal || portal.instance !== instance) {
        const fx = new fx_1.Fx(() => {
            instance_1.KireiInstance.active = instance;
            compiler_1.render(templateFn(), root);
            instance_1.KireiInstance.resetActive();
        }, { scheduler: Queue.push });
        portal = { instance, fx };
        lifecycle_1.onUnmount(() => {
            const p = portals.get(root);
            fx.stop();
            if (p === portal) {
                compiler_1.render(null, root);
                portals.delete(root);
            }
        });
        portals.set(root, portal);
    }
}
exports.portal = portal;
//# sourceMappingURL=portal.js.map