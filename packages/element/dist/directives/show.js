"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("../compiler");
const fx_1 = require("@kirei/fx");
compiler_1.directive('show', dir => {
    const { el } = dir;
    let value = true;
    return (pending) => {
        const newValue = !!fx_1.unRef(pending);
        if (newValue) {
            if (!value) {
                el.style.display = '';
            }
        }
        else if (value) {
            el.style.display = 'none';
        }
        value = newValue;
    };
});
//# sourceMappingURL=show.js.map