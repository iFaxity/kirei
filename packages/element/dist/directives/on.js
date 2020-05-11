"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
const compiler_1 = require("../compiler");
const NOOP = () => { };
const KEYBOARD_EVENTS = ['keydown', 'keyup', 'keypress'];
const KEYBOARD_MODS = ['ctrl', 'alt', 'shift', 'meta'];
const KEYBOARD_ALIASES = {
    'Enter': 'enter',
    'Tab': 'tab',
    'Delete': 'delete',
    'Backspace': 'delete',
    ' ': 'space',
    'Spacebar': 'space',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
};
const MOUSE_EVENTS = ['click', 'dblclick', 'mouseup', 'mousedown'];
// Mouse button values are (1 + idx) * 2
const MOUSE_KEYS = ['left', 'right', 'middle'];
// Checks if required meta keys was pressed
function hasMeta(e, meta) {
    return !meta.length || meta.every(name => e[`${name}Key`]);
}
// Checks if mod exists and removes it if it does.
function hasMod(mods, mod) {
    const idx = mods.indexOf(mod);
    if (idx != -1) {
        mods.splice(idx, 1);
    }
    return idx != -1;
}
function keyboardListener(listener, mods) {
    const meta = KEYBOARD_MODS.filter(mod => hasMod(mods, mod));
    return (e) => {
        var _a;
        if (meta.length && !hasMeta(e, meta))
            return;
        const key = (_a = KEYBOARD_ALIASES[e.key]) !== null && _a !== void 0 ? _a : shared_1.camelToKebab(e.key);
        if (mods.length && !mods.includes(key))
            return;
        return listener(e);
    };
}
function mouseListener(listener, mods) {
    const meta = KEYBOARD_MODS.filter(mod => hasMod(mods, mod));
    const idx = MOUSE_KEYS.findIndex(mod => hasMod(mods, mod));
    const button = 2 * (1 + idx);
    return (e) => {
        if (meta.length && !hasMeta(e, meta))
            return;
        if (button && e.button != button)
            return;
        return listener(e);
    };
}
compiler_1.directive('@', dir => {
    const { el, arg: eventName, mods } = dir;
    const prevent = hasMod(mods, 'prevent');
    const stop = hasMod(mods, 'stop');
    const self = hasMod(mods, 'self');
    const forceBind = prevent || stop;
    const options = {
        capture: hasMod(mods, 'capture'),
        once: hasMod(mods, 'once'),
        passive: hasMod(mods, 'passive'),
    };
    let value = NOOP;
    const boundListener = (e) => {
        if (self && e.target !== el)
            return;
        prevent && e.preventDefault();
        stop && e.stopPropagation();
        // Unpack the detail as a second argument (might not be set)
        return value.call(null, e, e.detail);
    };
    let listener = boundListener;
    if (mods.length) {
        if (KEYBOARD_EVENTS.includes(eventName)) {
            listener = keyboardListener(boundListener, mods);
        }
        else if (MOUSE_EVENTS.includes(eventName)) {
            listener = mouseListener(boundListener, mods);
        }
    }
    return (newValue) => {
        const fn = newValue !== null && newValue !== void 0 ? newValue : NOOP;
        if (!shared_1.isFunction(fn)) {
            throw new TypeError('Kirei: Events can only be bound to functions');
        }
        if (value !== newValue) {
            if (value != NOOP && fn == NOOP && !forceBind) {
                el.removeEventListener(eventName, listener, options);
            }
            else if (value == NOOP && fn != NOOP || forceBind) {
                el.addEventListener(eventName, listener, options);
            }
        }
        value = fn;
    };
});
//# sourceMappingURL=on.js.map