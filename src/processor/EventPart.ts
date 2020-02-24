import { Part, noChange, isDirective } from 'lit-html';
import { isFunction } from '../shared';

const noop = () => {};

type EventListener = (e: Event) => any;
export class FxEventPart implements Part {
  readonly element: Element;
  readonly eventName: string;
  readonly hasMods: boolean = false;
  readonly options?: AddEventListenerOptions;
  private __pendingValue: undefined|EventListener = undefined;
  readonly boundListener: EventListener;
  value: undefined|EventListener;

  constructor(element: Element, name: string, eventContext?: EventTarget) {
    const [ eventName, ...mods ] = name.split('.');
    const prevent = mods.includes('prevent');
    const stop = mods.includes('stop');
    const self = mods.includes('self');

    this.value = noop;
    this.element = element;
    this.eventName = eventName;
    this.hasMods = prevent || stop;
    this.options = {
      capture: mods.includes('capture'),
      once: mods.includes('once'),
      passive: mods.includes('passive'),
    };
    this.boundListener = (e) => {
      if (self && e.target !== element) return;
      prevent && e.preventDefault();
      stop && e.stopPropagation();

      this.value.call(eventContext ?? element, e);
    };
  }

  setValue(value: EventListener) {
    const listener = value ?? noop;
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

    if (this.__pendingValue == noChange) {
      return;
    }

    const listener = this.__pendingValue || noop;
    if (this.value != noop && listener == noop && !this.hasMods) {
      this.element.removeEventListener(this.eventName, this.boundListener, this.options);
    }

    if (this.value == noop && listener != noop || this.hasMods) {
      this.element.addEventListener(this.eventName, this.boundListener, this.options);
    }

    this.value = this.__pendingValue;
    this.__pendingValue = noChange as EventListener;
  }
}
