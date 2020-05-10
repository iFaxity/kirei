"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("./shared");
const shared_2 = require("@kirei/shared");
/**
 * Maps a style or class attribute from an array or an object to a string
 * @param {object|array} className
 * @returns {string}
 */
function mapAttribute(className) {
    if (!shared_2.isObject(className))
        return className;
    if (Array.isArray(className)) {
        return className.filter(x => x).join(' ');
    }
    return Object.keys(className).filter(key => !!className[key]).join(' ');
}
// Special patchers for prop and event
function propPatcher(node, name) {
    return (pending) => { node[name] = pending; };
}
function eventPatcher(node, name) {
    // Using a bound listener prevents frequent remounting
    let listener;
    const boundListener = (e) => listener.call(node, e);
    return (pending) => {
        if (listener !== pending) {
            if (pending == null) {
                node.removeEventListener(name, boundListener, false);
            }
            else if (listener == null) {
                node.addEventListener(name, boundListener, false);
            }
            listener = pending;
        }
    };
}
exports.defaultCompiler = {
    attr(node, name) {
        const prefix = name[0];
        if (prefix == '.') {
            return propPatcher(node, name.slice(1));
        }
        else if (prefix == '@') {
            return eventPatcher(node, name.slice(1));
        }
        // Default to attribute parsing
        const shouldMap = name == 'class' || name == 'style';
        const attr = document.createAttribute(name);
        let value;
        let mounted = false;
        return (pending) => {
            if (value === pending)
                return;
            value = pending;
            if (value == null) {
                if (mounted) {
                    node.removeAttributeNode(attr);
                    mounted = false;
                }
            }
            else {
                attr.value = shouldMap ? mapAttribute(value) : value;
                if (!mounted) {
                    node.setAttributeNode(attr);
                    mounted = true;
                }
            }
        };
    },
    node(ref) {
        let nodes = [];
        let value;
        let text;
        const nodeParser = (pending) => {
            // TODO: allow object as text, as refs have toString
            if (pending == null) {
                // null, and undefined are used to cleanup previous content
                if (value) {
                    value = pending;
                    nodes = shared_1.diff(ref, nodes, []);
                }
            }
            else if (typeof pending != 'object') {
                // primitives are handled as text content
                if (value !== pending) {
                    value = pending;
                    if (!text) {
                        text = document.createTextNode(value);
                    }
                    else {
                        text.textContent = value;
                    }
                    nodes = shared_1.diff(ref, nodes, [text]);
                }
            }
            else if ('nodeType' in pending && pending !== value) {
                // if the new value is a DOM node, or a wire, and it's
                // different from the one already live, then it's diffed.
                // if the node is a fragment, it's appended once via its childNodes
                // There is no `else` here, meaning if the content
                // is not expected one, nothing happens, as easy as that.
                value = pending instanceof DocumentFragment ? Array.from(pending.childNodes) : [pending];
                nodes = shared_1.diff(ref, nodes, value);
            }
            else if (Array.isArray(pending)) {
                // arrays and nodes have a special treatment
                value = pending;
                if (value.length === 0 || typeof value[0] === 'object') {
                    // arrays can be used to cleanup, if empty
                    // or diffed, if these contains nodes or "wires"
                    nodes = shared_1.diff(ref, nodes, value);
                }
                else if (value !== pending) {
                    // in all other cases the content is stringified as is
                    nodeParser(String(pending));
                }
            }
            else {
                shared_2.error('Invalid node expression in html template');
            }
        };
        return nodeParser;
    },
    text(node) {
        let value;
        return (pending) => {
            if (value !== pending) {
                value = pending;
                node.textContent = value == null ? '' : value;
            }
        };
    },
};
//# sourceMappingURL=compiler.js.map