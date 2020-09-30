import { TemplatePatcher } from '@kirei/html';
import { isFunction, isString } from '@kirei/shared';
import { hyphenate } from '@vue/shared';
import { directive, Directive } from '../compiler';
import { KireiInstance } from '../instance';
import { warn } from '../logging';

type EventListener = (e: Event) => any;

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
const MOUSE_KEYS = [ 'left', 'middle', 'right' ];

// Checks if required meta keys was pressed
function hasMeta(e: KeyboardEvent|MouseEvent, meta: string[]): boolean {
  return !meta.length || meta.every(name => e[`${name}Key`]);
}

// Checks if mod exists and removes it if it does.
function hasMod(mods: string[], mod: string): boolean {
  const idx = mods.indexOf(mod);
  return idx != -1 ? (mods.splice(idx, 1), true) : false;
}

function keyboardListener(listener: EventListener, mods: string[]): EventListener {
  const meta = KEYBOARD_MODS.filter(mod => hasMod(mods, mod));

  return (e: KeyboardEvent) => {
    if (meta.length && !hasMeta(e, meta)) return;

    const key = KEYBOARD_ALIASES[e.key] ?? hyphenate(e.key);
    if (mods.length && !mods.includes(key)) return;
    return listener(e);
  };
}

function mouseListener(listener: EventListener, mods: string[]): EventListener {
  const meta = KEYBOARD_MODS.filter(mod => hasMod(mods, mod));
  const btn = MOUSE_KEYS.findIndex(mod => hasMod(mods, mod));

  return (e: MouseEvent) => {
    if (meta.length && !hasMeta(e, meta)) return;
    if (btn != -1 && e.button != btn) return;
    return listener(e);
  };
}

function nativePatcher(dir: Directive): TemplatePatcher {
  const { el, arg: eventName, mods } = dir;
  const prevent = hasMod(mods, 'prevent');
  const stop = hasMod(mods, 'stop');
  const self = hasMod(mods, 'self');
  const forceBind = prevent || stop;
  const options: AddEventListenerOptions = {
    capture: hasMod(mods, 'capture'),
    once: hasMod(mods, 'once'),
    passive: hasMod(mods, 'passive'),
  };

  let value: EventListener = NOOP;
  let listener = (e: Event) => {
    if (self && e.target !== el) return;
    prevent && e.preventDefault();
    stop && e.stopPropagation();

    return value.call(null, e);
  }

  if (mods.length) {
    if (KEYBOARD_EVENTS.includes(eventName)) {
      listener = keyboardListener(listener, mods);
    } else if (MOUSE_EVENTS.includes(eventName)) {
      listener = mouseListener(listener, mods);
    }
  }

  return (pending: EventListener = NOOP) => {
    if (!isFunction(pending)) {
      throw new TypeError('Kirei: Events can only be bound to functions');
    }

    if (value !== pending) {
      if (value != NOOP && pending == NOOP && !forceBind) {
        el.removeEventListener(eventName, listener, options);
      } else if (value == NOOP && pending != NOOP || forceBind) {
        el.addEventListener(eventName, listener, options);
      }
    }

    value = pending;
  };
}

export default directive([ 'on', '@' ], dir => {
  const instance = KireiInstance.get(dir.el);

  // TODO: Maybe support multiple events in the future?
  // Instance swallows event if defined in 'emits'. Otherwise bind to native handler.
  if (instance) {
    const { mods, arg: event } = dir;

    // Expected an argument as string
    if (!isString(event)) {
      throw new TypeError('');
    } else if (instance.options.emits[event]) {
      const once = mods.includes('once');
      let value: Function;

      return (pending: Function) => {
        if (value === pending) return;

        if (!isFunction(pending) || pending != null) {
          warn(`x-on directive expected a function or a nullable value, got ${typeof pending}`);
        }

        if (value) {
          const handler = once ? instance.once : instance.on;
          handler.call(instance, event, pending);
        } else {
          instance.off(event);
        }

        value = pending;
      };
    }
  }

  // Native event patcher
  return nativePatcher(dir);
});
