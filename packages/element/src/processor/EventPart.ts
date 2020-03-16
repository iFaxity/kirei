import { Part, noChange, isDirective } from 'lit-html';
import { isFunction, camelToKebab } from '../shared';

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

function hasMod(arr: string[], item: string) {
  const idx = arr.indexOf(item);

  if (idx != -1) {
    arr.splice(idx, 1);
  }

  return idx >= 0;
}

type EventListener = (e: Event, detail?: any) => any;
export class FxEventPart implements Part {
  readonly element: Element;
  readonly eventName: string;
  readonly forceBind: boolean = false;
  readonly options?: AddEventListenerOptions;
  private __pendingValue: undefined|EventListener = undefined;
  readonly boundListener: EventListener;
  value: undefined|EventListener;

  constructor(element: Element, name: string, eventContext?: EventTarget) {
    const [ eventName, ...mods ] = name.split('.');
    const prevent = hasMod(mods, 'prevent');
    const stop = hasMod(mods, 'stop');
    const self = hasMod(mods, 'self');

    this.value = NOOP;
    this.element = element;
    this.eventName = eventName;
    this.forceBind = prevent || stop;
    this.options = {
      capture: hasMod(mods, 'capture'),
      once: hasMod(mods, 'once'),
      passive: hasMod(mods, 'passive'),
    };
    const boundListener = (e: Event) => {
      if (self && e.target !== element) return;
      prevent && e.preventDefault();
      stop && e.stopPropagation();

      // Unpack the detail as a second argument
      const data = e instanceof CustomEvent ? e.detail : undefined;
      return this.value.call(eventContext ?? element, e, data);
    };

    let listener: EventListener = boundListener;
    if (mods.length) {
      if (KEYBOARD_EVENTS.includes(eventName)) {
        listener = this.keyboardListener(boundListener, mods);
      } else if (MOUSE_EVENTS.includes(eventName)) {
        listener = this.mouseListener(boundListener, mods);
      }
    }

    this.boundListener = listener;
  }

  keyboardListener(listener: EventListener, mods: string[]): EventListener {
    const meta = KEYBOARD_MODS.filter(mod => hasMod(mods, mod));

    return (e: KeyboardEvent) => {
      if (meta.length && !hasMeta(e, meta)) return;

      const key = KEYBOARD_ALIASES[e.key] ?? camelToKebab(e.key);
      if (mods.length && !mods.includes(key)) return;

      return listener(e);
    };
  }

  mouseListener(listener: EventListener, mods: string[]): EventListener {
    const idx = MOUSE_KEYS.findIndex(mod => hasMod(mods, mod))
    const button = 2 * (1 + idx);

    if (button) {
      return (e: MouseEvent) => {
        if (e.button == button) {
          return listener(e);
        }
      };
    }

    return listener;
  }

  setValue(value: EventListener) {
    const listener = value ?? NOOP;
    if (!isFunction(listener)) {
      throw new TypeError('Lit: Events can only be bound to functions');
    }

    this.__pendingValue = listener;
  }

  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue;
      this.__pendingValue = noChange as EventListener;
      directive(this);
    }

    if (this.__pendingValue == noChange) return;

    const listener = this.__pendingValue || NOOP;
    if (this.value != NOOP && listener == NOOP && !this.forceBind) {
      this.element.removeEventListener(this.eventName, this.boundListener, this.options);
    }

    if (this.value == NOOP && listener != NOOP || this.forceBind) {
      this.element.addEventListener(this.eventName, this.boundListener, this.options);
    }

    this.value = this.__pendingValue;
    this.__pendingValue = noChange as EventListener;
  }
}
