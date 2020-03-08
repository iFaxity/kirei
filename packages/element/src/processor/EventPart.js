import { noChange, isDirective } from 'lit-html';
import { isFunction } from '../shared';
const noop = () => { };
export class FxEventPart {
    constructor(element, name, eventContext) {
        this.hasMods = false;
        this.__pendingValue = undefined;
        const [eventName, ...mods] = name.split('.');
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
            if (self && e.target !== element)
                return;
            prevent && e.preventDefault();
            stop && e.stopPropagation();
            // Unpack the detail as a second argument
            const data = e instanceof CustomEvent ? e.detail : undefined;
            this.value.call(eventContext !== null && eventContext !== void 0 ? eventContext : element, e, data);
        };
    }
    setValue(value) {
        const listener = value !== null && value !== void 0 ? value : noop;
        if (!isFunction(listener)) {
            throw new TypeError('Lit: Events can only be bound to functions');
        }
        this.__pendingValue = listener;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
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
        this.__pendingValue = noChange;
    }
}
//# sourceMappingURL=EventPart.js.map