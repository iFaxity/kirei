"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
const instance_1 = require("../instance");
const HOOKS = [];
var HookTypes;
(function (HookTypes) {
    HookTypes["BEFORE_MOUNT"] = "beforeMount";
    HookTypes["MOUNT"] = "mount";
    HookTypes["BEFORE_UPDATE"] = "beforeUpdate";
    HookTypes["UPDATE"] = "update";
    HookTypes["BEFORE_UNMOUNT"] = "beforeUnmount";
    HookTypes["UNMOUNT"] = "unmount";
})(HookTypes = exports.HookTypes || (exports.HookTypes = {}));
/**
 * Creates a new hook to set on the active instance
 * @param {string} hook Hook name
 * @return {Function}
 */
function defineHook(name) {
    if (HOOKS.includes(name)) {
        shared_1.exception('A lifecycle hook with that key already exists', `defineHook(${name})`);
    }
    // Keep track of what hook keys are used
    HOOKS.push(name);
    return (hook) => {
        var _a;
        const instance = instance_1.KireiInstance.active;
        if (!instance) {
            shared_1.exception('Lifecycle hooks needs have a setup function in it\'s call stack.');
        }
        else if (!shared_1.isFunction(hook)) {
            shared_1.exception('Lifecycle hooks requires the parameter to be a function.');
        }
        const { hooks } = instance;
        hooks[name] = (_a = hooks[name]) !== null && _a !== void 0 ? _a : new Set();
        hooks[name].add(hook);
    };
}
exports.defineHook = defineHook;
/** Registers a new hook it runs before instance is mounted */
exports.onBeforeMount = defineHook(HookTypes.BEFORE_MOUNT);
/** Registers a new hook it runs after instance is mounted */
exports.onMount = defineHook(HookTypes.MOUNT);
/** Registers a new hook it runs before instance is updated */
exports.onBeforeUpdate = defineHook(HookTypes.BEFORE_UPDATE);
/** Registers a new hook it runs after instance is updated */
exports.onUpdate = defineHook(HookTypes.UPDATE);
/** Registers a new hook it runs before instance is unmounted */
exports.onBeforeUnmount = defineHook(HookTypes.BEFORE_UNMOUNT);
/** Registers a new hook it runs after instance is unmounted */
exports.onUnmount = defineHook(HookTypes.UNMOUNT);
//# sourceMappingURL=lifecycle.js.map