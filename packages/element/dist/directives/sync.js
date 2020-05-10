"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instance_1 = require("../instance");
const fx_1 = require("@kirei/fx");
const compiler_1 = require("../compiler");
const queue_1 = require("../queue");
function selectHandler(el, ref) {
    var _a;
    const options = el.selectedOptions;
    if (el.multiple) {
        return !options.length ? [] : Array.from(options).map(o => o.value);
    }
    return (_a = options[0]) === null || _a === void 0 ? void 0 : _a.value;
}
async function selectCommit(el, ref) {
    const { options } = el;
    const value = ref.value;
    // Synced select elements has to be committed on the nextTick.
    // As dynamic content could have not loaded yet.
    // Another solution is to execute all attribute patches last, but is more cumbersome.
    await queue_1.nextTick();
    if (el.multiple) {
        const values = value;
        for (let i = 0; i < options.length; i++) {
            const o = options[i];
            o.selected = values.includes(o.value);
        }
    }
    else {
        for (let i = 0; i < options.length; i++) {
            const o = options[i];
            o.selected = value === o.value;
        }
    }
}
function radioCommit(el, ref) {
    el.checked = ref.value === el.value;
}
function checkboxHandler(el, ref) {
    var _a;
    const list = ref.value;
    if (Array.isArray(list)) {
        const idx = list.indexOf(el.value);
        if (idx >= 0) {
            list.splice(idx, 1);
        }
        else {
            list.push(el.value);
        }
        return list;
    }
    return (_a = el.value) !== null && _a !== void 0 ? _a : el.checked;
}
function checkboxCommit(el, ref) {
    const value = ref.value;
    if (Array.isArray(value)) {
        const values = value;
        el.checked = values.includes(el.value);
    }
    else {
        el.checked = value === el.value;
    }
}
function mutationHandlers(dir) {
    const { el, arg, mods } = dir;
    let eventName;
    let prop = arg;
    let handler;
    let commit = (el, ref) => {
        el[prop] = ref.value;
    };
    // bind to default sync, like form fields or using the sync name on instance
    // This sets value on the fx from child
    if (prop === '') {
        const tag = el.tagName.toLowerCase();
        const type = el.type;
        const isInput = tag == 'input';
        if (tag == 'select') {
            eventName = 'change';
            handler = selectHandler;
            commit = selectCommit;
        }
        else if (isInput && type == 'checkbox') {
            eventName = 'change';
            handler = checkboxHandler;
            commit = checkboxCommit;
        }
        else if (isInput && type == 'radio') {
            eventName = 'change';
            prop = 'value';
            commit = radioCommit;
        }
        else if (isInput || tag == 'textarea') {
            // lazy modifier only for text input
            eventName = mods.includes('lazy') ? 'change' : 'input';
            prop = 'value';
        }
        else {
            const instance = instance_1.instances.get(el);
            if (instance) {
                prop = instance.options.sync;
            }
            else {
                throw new Error(`Default syncing not supported for element '${tag}'.`);
            }
        }
    }
    return { commit, handler, prop, eventName };
}
// directive format &[value.number.trim.lazy]=${ref}
compiler_1.directive('&', dir => {
    const { el, mods } = dir;
    const { commit, handler, prop, eventName } = mutationHandlers(dir);
    const castNumber = mods.includes('number');
    const trimValue = mods.includes('trim');
    let ref;
    el.addEventListener(eventName !== null && eventName !== void 0 ? eventName : `fxsync::${prop}`, (e) => {
        var _a;
        e.stopPropagation();
        let value = (_a = handler === null || handler === void 0 ? void 0 : handler(el, ref)) !== null && _a !== void 0 ? _a : (e instanceof CustomEvent ? e.detail : el[prop]);
        // Cast value if set
        if (typeof value == 'string') {
            if (castNumber) {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    value = num;
                }
            }
            else if (trimValue) {
                value = value.trim();
            }
        }
        ref.value = value;
    }, false);
    return (newRef) => {
        if (!fx_1.isRef(newRef)) {
            throw new TypeError('Sync directive requires a ref as it\'s value');
        }
        ref = newRef;
        commit(el, ref);
    };
});
//# sourceMappingURL=sync.js.map