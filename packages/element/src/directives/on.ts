import type { TemplatePatcher } from '@kirei/html';
import { hyphenate, isFunction, isString } from '@vue/shared';
import { getComponentInstance } from '../runtime/instance';
import { warn } from '../warn';

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
function hasMod(modifiers: string[], mod: string): boolean {
  const idx = modifiers.indexOf(mod);
  return idx != -1 ? (modifiers.splice(idx, 1), true) : false;
}

function keyboardListener(listener: EventListener, modifiers: string[]): EventListener {
  const meta = KEYBOARD_MODS.filter(mod => hasMod(modifiers, mod));

  return (e: KeyboardEvent) => {
    if (meta.length && !hasMeta(e, meta)) return;

    const key = KEYBOARD_ALIASES[e.key] ?? hyphenate(e.key);
    if (modifiers.length && !modifiers.includes(key)) return;
    return listener(e);
  };
}

function mouseListener(listener: EventListener, modifiers: string[]): EventListener {
  const meta = KEYBOARD_MODS.filter(mod => hasMod(modifiers, mod));
  const btn = MOUSE_KEYS.findIndex(mod => hasMod(modifiers, mod));

  return (e: MouseEvent) => {
    if (meta.length && !hasMeta(e, meta)) return;
    if (btn != -1 && e.button != btn) return;
    return listener(e);
  };
}

function nativePatcher(el: HTMLElement, eventName: string, modifiers: string[]): TemplatePatcher {
  const prevent = hasMod(modifiers, 'prevent');
  const stop = hasMod(modifiers, 'stop');
  const self = hasMod(modifiers, 'self');
  const forceBind = prevent || stop;
  const options: AddEventListenerOptions = {
    capture: hasMod(modifiers, 'capture'),
    once: hasMod(modifiers, 'once'),
    passive: hasMod(modifiers, 'passive'),
  };

  let value: EventListener = NOOP;
  let listener = (e: Event) => {
    if (self && e.target !== el) return;
    prevent && e.preventDefault();
    stop && e.stopPropagation();

    return value.call(null, e);
  }

  if (modifiers.length) {
    if (KEYBOARD_EVENTS.includes(eventName)) {
      listener = keyboardListener(listener, modifiers);
    } else if (MOUSE_EVENTS.includes(eventName)) {
      listener = mouseListener(listener, modifiers);
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

export function on(el: HTMLElement, arg: string, modifiers: string[]): TemplatePatcher {
  const instance = getComponentInstance(el);

  // TODO: Maybe support multiple events in the future?
  // Instance swallows event if defined in 'emits'. Otherwise bind to native handler.
  if (instance) {
    // Expected an argument as string
    if (!isString(arg)) {
      throw new TypeError('');
    } else if (instance.options.emits[arg]) {
      const once = modifiers.includes('once');
      let value: Function;

      return (pending: Function) => {
        if (value === pending) return;

        if (!isFunction(pending) || pending != null) {
          warn(`v-on directive expected a function or a nullable value, got ${typeof pending}`);
        }

        if (!pending) {
          instance.off(arg, value);
        } else if (once) {
          instance.once(arg, pending);
        } else {
          instance.on(arg, pending)
        }

        value = pending;
      };
    }
  }

  // Native event patcher
  return nativePatcher(el, arg, modifiers);
}
