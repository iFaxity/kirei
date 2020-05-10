"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instance_1 = require("../instance");
const shared_1 = require("@kirei/shared");
function provide(key, value) {
    const instance = instance_1.KireiInstance.active;
    let { provides, parent } = instance;
    if ((parent === null || parent === void 0 ? void 0 : parent.provides) === provides) {
        provides = instance.provides = Object.create(parent.provides);
    }
    provides[key] = value;
}
exports.provide = provide;
function inject(key, defaultValue) {
    const instance = instance_1.KireiInstance.active;
    if (instance) {
        const { provides } = instance;
        if (key in provides) {
            return provides[key];
        }
        else if (arguments.length > 1) {
            return defaultValue;
        }
        shared_1.warn(`Injection "${key}" not found.`);
    }
    else {
        shared_1.warn(`inject() requires to have a setup function in its call stack.`);
    }
}
exports.inject = inject;
//# sourceMappingURL=inject.js.map