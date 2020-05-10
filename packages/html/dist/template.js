"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uparser_1 = require("uparser");
const shared_1 = require("./shared");
const compiler_1 = require("./compiler");
const TEXT_TAGS = ['style', 'textarea'];
const prefix = 'isµ';
const contentCache = new WeakMap();
var PatchType;
(function (PatchType) {
    PatchType["NODE"] = "node";
    PatchType["ATTR"] = "attr";
    PatchType["TEXT"] = "text";
})(PatchType || (PatchType = {}));
function createCache() {
    return { stack: [], instance: null, node: null };
}
exports.createCache = createCache;
function createPatch(node, type, attr) {
    // Index the node relative to the root, essentialy "paving" a path
    const path = [];
    while (node.parentNode) {
        let i = 0;
        for (let n = node; (n = n.previousSibling); i++)
            ;
        node = node.parentNode;
        path.push(i);
    }
    return { attr, type, path };
}
function compileContent(type, strings, scopeName) {
    var _a, _b;
    // Compile the template element
    const template = shared_1.createTemplate(type, uparser_1.default(strings, prefix, type == 'svg'));
    const patches = [];
    const walker = shared_1.createWalker(template.content);
    const len = strings.length - 1;
    let i = 0;
    let search = `${prefix}${i}`;
    // Before we map the patchers we need to reconstruct the template styles
    // Merge all style elements and hoist the master up to the top
    // This optimizes performance, especially within shims
    const styles = template.querySelectorAll('style');
    if (styles.length) {
        const style = styles[0];
        template.insertBefore(style, template.firstChild);
        for (let i = 1; i < styles.length; i++) {
            const el = styles[i];
            (_a = el.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(el);
            style.textContent += el.textContent;
        }
    }
    while (i < len) {
        const node = walker.nextNode();
        if (!node)
            throw new Error('Parsing error');
        // if the current node is a comment, and it contains isµX
        // it means the update should take care of any content
        if (node.nodeType == Node.COMMENT_NODE) {
            // The only comments to be considered are those
            // which content is exactly the same as the searched one.
            if (node.textContent === search) {
                node.textContent = '';
                patches[i] = createPatch(node, PatchType.NODE);
                search = `${prefix}${++i}`;
            }
        }
        else {
            const el = node;
            // if the node is not a comment, loop through all its attributes
            // named isµX and relate attribute updates to this node and the
            // attribute name, retrieved through node.getAttribute("isµX")
            // the isµX attribute will be removed as irrelevant for the layout
            let attr;
            while ((attr = el.getAttribute(search))) {
                el.removeAttribute(search);
                patches[i] = createPatch(node, PatchType.ATTR, attr);
                search = `${prefix}${++i}`;
            }
            // if the node was a style or a textarea one, check its content
            // and if it is <!--isµX--> then update text-only this node
            if (TEXT_TAGS.includes(el.localName) && node.textContent.trim() === `<!--${search}-->`) {
                node.textContent = '';
                patches[i] = createPatch(node, PatchType.TEXT);
                search = `${prefix}${++i}`;
            }
        }
    }
    // Apply shady shim, runs both prepareTemplateDom and prepareTemplateStyles
    if (scopeName) {
        (_b = window.ShadyCSS) === null || _b === void 0 ? void 0 : _b.prepareTemplate(template, scopeName);
    }
    return { node: template, patches };
}
function createInstance(template, compiler, scopeName) {
    const { strings, type } = template;
    let content = contentCache.get(strings);
    if (!content) {
        contentCache.set(strings, (content = compileContent(type, strings, scopeName)));
    }
    const { patches, node } = content;
    const root = document.importNode(node.content, true);
    const patchers = patches.map(({ type, attr, path }) => {
        var _a;
        // Fallback to defaultCompiler
        const node = path.reduceRight((n, i) => n.childNodes[i], root);
        return ((_a = compiler === null || compiler === void 0 ? void 0 : compiler[type]) === null || _a === void 0 ? void 0 : _a.call(compiler, node, attr)) || compiler_1.defaultCompiler[type](node, attr);
    });
    return { strings, type, patchers, root };
}
class Template {
    constructor(type, strings, values) {
        this.type = type;
        this.strings = strings;
        this.values = values;
    }
    update(cache, compiler, scopeName) {
        const { strings, type, values } = this;
        let { instance } = cache;
        updateValues(cache, values, compiler);
        // Create instance if first cache is empty
        // Update instance if template has changed
        if (!instance || instance.strings !== strings || instance.type !== type) {
            instance = (cache.instance = createInstance(this, compiler, scopeName));
        }
        // Update instance values
        const { patchers } = instance;
        for (let i = 0; i < values.length; i++) {
            patchers[i](values[i]);
        }
        return cache.node || (cache.node = shared_1.persistent(instance.root));
    }
}
exports.Template = Template;
function updateValues(cache, values, compiler) {
    var _a, _b;
    const { stack } = cache;
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        let cache;
        if (value instanceof Template) {
            cache = (_a = stack[i]) !== null && _a !== void 0 ? _a : createCache();
            values[i] = value.update(cache, compiler);
        }
        else if (Array.isArray(value)) {
            cache = (_b = stack[i]) !== null && _b !== void 0 ? _b : createCache();
            updateValues(cache, value, compiler);
        }
        stack[i] = cache;
    }
    // This will make sure the stack is fully drained
    if (values.length < stack.length) {
        stack.splice(values.length);
    }
}
//# sourceMappingURL=template.js.map