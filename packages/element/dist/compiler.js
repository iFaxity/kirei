"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const html_1 = require("@kirei/html");
const fx_1 = require("@kirei/fx");
const instance_1 = require("./instance");
const aliases = [];
const directives = Object.create(null);
const DIRECTIVE_REGEX = /^([a-z0-9@#&$%*!?;=^-]+)(?:\:([a-z0-9-]*))?((?:\.[a-z0-9-]+)*)$/i;
// directive name
function directive(name, directive) {
    if (typeof name != 'string') {
        throw new TypeError('Invalid directive name');
    }
    else if (directives[name]) {
        throw new Error('Directive already exists');
    }
    if (name.length == 1) {
        aliases.push(name);
    }
    directives[name] = directive;
}
exports.directive = directive;
// Custom compiler for directives and to unpack reactives
const compiler = {
    attr(node, attr) {
        var _a, _b, _c;
        // Check if directive exists for attribute
        if (aliases.includes(attr[0])) {
            attr = `${attr[0]}:${attr.slice(1)}`;
        }
        const match = attr.match(DIRECTIVE_REGEX);
        if (!match) {
            throw new TypeError('Invalid directive format');
        }
        const name = match[1];
        const factory = (_a = directives[name]) !== null && _a !== void 0 ? _a : (_b = instance_1.KireiInstance.active.directives) === null || _b === void 0 ? void 0 : _b[name];
        if (factory) {
            return factory.call(null, {
                el: node, name,
                arg: (_c = match[2]) !== null && _c !== void 0 ? _c : '',
                mods: match[3] ? match[3].slice(1).split('.') : [],
            });
        }
        // Use default patcher
        const patch = html_1.defaultCompiler.attr(node, attr);
        return (newValue) => patch(fx_1.unRef(newValue));
    },
    node(ref) {
        const patch = html_1.defaultCompiler.node(ref);
        return (newValue) => patch(fx_1.unRef(newValue));
    },
    text(node) {
        const patch = html_1.defaultCompiler.text(node);
        return (newValue) => patch(fx_1.unRef(newValue));
    },
};
_a = html_1.customize({ compiler }), exports.html = _a.html, exports.svg = _a.svg, exports.render = _a.render;
//# sourceMappingURL=compiler.js.map