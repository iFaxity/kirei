"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fx_1 = require("@kirei/fx");
const compiler_1 = require("../compiler");
// This is a special directive
compiler_1.directive('ref', dir => {
    return (ref) => {
        if (!fx_1.isRef(ref)) {
            throw new TypeError('Ref directive requires a ref as it\'s expression value');
        }
        ref.value = dir.el;
    };
});
//# sourceMappingURL=ref.js.map