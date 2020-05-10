"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("../compiler");
const fx_1 = require("@kirei/fx");
compiler_1.directive('if', dir => {
    const { el, arg } = dir;
    const invert = arg == 'not';
    const ref = document.createComment('');
    let node = el;
    return (pending) => {
        var _a;
        const value = fx_1.unRef(pending);
        const newNode = (invert ? !value : !!value) ? el : ref;
        if (newNode !== node) {
            (_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(newNode, node);
            node = newNode;
        }
    };
});
//# sourceMappingURL=if.js.map