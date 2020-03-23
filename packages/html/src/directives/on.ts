import { isFunction, camelToKebab } from '@shlim/shared';
import { directive } from './';

type EventListener = (e: Event, detail?: any) => any;

const NOOP = () => {};
const KEYBOARD_EVENTS = [ 'keydown', 'keyup', 'keypress' ];
const KEYBOARD_MODS = [ 'ctrl', 'alt', 'shift', 'meta' ];
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

const MOUSE_EVENTS = [ 'click', 'dblclick', 'mouseup', 'mousedown' ];
// Mouse button values are (1 + idx) * 2
const MOUSE_KEYS = [ 'left', 'right', 'middle' ];

// Checks if required meta keys was pressed
function hasMeta(e: KeyboardEvent|MouseEvent, meta: string[]): boolean {
  return !meta.length || meta.every(name => e[`${name}Key`]);
}
// Checks if mod exists and removes it if it does.
function hasMod(mods: string[], mod: string): boolean {
  const idx = mods.indexOf(mod);
  if (idx != -1) {
    mods.splice(idx, 1);
  }
  return idx != -1;
}

function keyboardListener(listener: EventListener, mods: string[]): EventListener {
  const meta = KEYBOARD_MODS.filter(mod => hasMod(mods, mod));

  return (e: KeyboardEvent) => {
    if (meta.length && !hasMeta(e, meta)) return;

    const key = KEYBOARD_ALIASES[e.key] ?? camelToKebab(e.key);
    if (mods.length && !mods.includes(key)) return;

    return listener(e);
  };
}

function mouseListener(listener: EventListener, mods: string[]): EventListener {
  const meta = KEYBOARD_MODS.filter(mod => hasMod(mods, mod));
  const idx = MOUSE_KEYS.findIndex(mod => hasMod(mods, mod))
  const button = 2 * (1 + idx);

  return (e: MouseEvent) => {
    if (meta.length && !hasMeta(e, meta)) return;
    if (button && e.button != button) return;

    return listener(e);
  };
}

directive('on', dir => {
  const { el, arg: eventName, mods } = dir;
  const prevent = hasMod(mods, 'prevent');
  const stop = hasMod(mods, 'stop');
  const self = hasMod(mods, 'self');
  const forceBind = prevent || stop;
  const options = {
    capture: hasMod(mods, 'capture'),
    once: hasMod(mods, 'once'),
    passive: hasMod(mods, 'passive'),
  } as AddEventListenerOptions;

  let value: EventListener = NOOP;
  const boundListener: EventListener = (e: CustomEvent) => {
    if (self && e.target !== el) return;
    prevent && e.preventDefault();
    stop && e.stopPropagation();

    // Unpack the detail as a second argument (might not be set)
    return value.call(el, e, e.detail);
  };

  let listener: EventListener = boundListener;
  if (mods.length) {
    if (KEYBOARD_EVENTS.includes(eventName)) {
      listener = keyboardListener(boundListener, mods);
    } else if (MOUSE_EVENTS.includes(eventName)) {
      listener = mouseListener(boundListener, mods);
    }
  }

  return (newValue: EventListener) => {
    const fn = newValue ?? NOOP;
    if (!isFunction(fn)) {
      throw new TypeError('Shlim: Events can only be bound to functions');
    }

    if (value !== newValue) {
      if (value != NOOP && fn == NOOP && !forceBind) {
        el.removeEventListener(eventName, listener, options);
      } else if (value == NOOP && fn != NOOP || forceBind) {
        el.addEventListener(eventName, listener, options);
      }
    }

    value = fn;
  };
});
