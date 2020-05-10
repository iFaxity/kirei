"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const template_1 = require("./template");
exports.Template = template_1.Template;
const shared_1 = require("@kirei/shared");
var compiler_1 = require("./compiler");
exports.defaultCompiler = compiler_1.defaultCompiler;
const shared_2 = require("./shared");
const rendered = new WeakMap();
const { html, svg, render } = customize();
exports.html = html;
exports.svg = svg;
exports.render = render;
function customize(opts = {}) {
    const { compiler } = opts;
    return {
        /**
         * Renders a template to a specific root container
         * @param {Template|Node} template Template or Node to render from
         * @param {HTMLElement|ShadowRoot|DocumentFragment} root Root node to render content to
         * @param {string} [scopeName] The custom element tag name, only used for webcomponents shims
         */
        render(template, root, scopeName) {
            if (template) {
                let cache = rendered.get(root);
                if (!cache) {
                    rendered.set(root, (cache = template_1.createCache()));
                }
                let node;
                if (template instanceof template_1.Template) {
                    node = template.update(cache, compiler, scopeName);
                }
                else if (template instanceof Node) {
                    node = template;
                }
                else {
                    throw new Error('Invalid render template, expected Template or Node');
                }
                if (cache.node !== node) {
                    shared_2.clearNode(root);
                    cache.node = node;
                    root.appendChild(node.valueOf());
                }
            }
            else if (template == null) {
                const cache = rendered.get(root);
                // Cleanup root and clear cache
                if (cache) {
                    shared_2.clearNode(root);
                    cache.node = null;
                }
            }
            else {
                throw new TypeError('Template renderer can expects a valid Template as it\'s first argument');
            }
        },
        /**
         * Creates a template with html content
         */
        html: createLiteral('html', opts),
        /**
         * Creates a template with svg content
         */
        svg: createLiteral('svg', opts),
    };
}
exports.customize = customize;
function createLiteral(type, opts) {
    const { compiler, literals } = opts;
    // Every literal has its own cache for keyed templates
    const keyed = new WeakMap();
    const template = (strings, ...values) => {
        return new template_1.Template(type, strings, values);
    };
    template.key = (ref, key, template) => {
        // Key is optional as we can key by the reference object
        if (!template) {
            template = key;
            key = void 0;
        }
        let memo = keyed.get(ref);
        if (!memo) {
            keyed.set(ref, (memo = new Map()));
        }
        // keyed operations always re-use the same cache and unroll
        // the template and its interpolations right away
        let cache = memo.get(key);
        if (!cache) {
            memo.set(key, (cache = template_1.createCache()));
        }
        // Update template and return the cached node
        return template.update(cache, compiler);
    };
    // Add extension methods to literal
    if (shared_1.isObject(literals)) {
        for (let key of Object.keys(literals)) {
            if (key in template) {
                throw new Error('Cannot override properties in literals');
            }
            template[key] = literals[key];
        }
    }
    return template;
}
//# sourceMappingURL=index.js.map