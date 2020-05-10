"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("../compiler");
const shared_1 = require("@kirei/shared");
compiler_1.directive('attrs', dir => {
    const { el } = dir;
    return (pending) => {
        var _a;
        if (!shared_1.isObject(pending)) {
            return shared_1.warn('Directive requires the expression value to be an object', 'attrs (directive)');
        }
        for (const key of Object.keys(pending)) {
            const value = pending[key];
            if (value) {
                const attr = (_a = el.getAttributeNode(key)) !== null && _a !== void 0 ? _a : document.createAttribute(key);
                attr.value = value;
            }
            else {
                el.removeAttribute(key);
            }
        }
    };
});
//# sourceMappingURL=attrs.js.map