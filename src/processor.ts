import {
  TemplateProcessor,
  Part,
  AttributePart,
  AttributeCommitter,
  BooleanAttributePart,
  NodePart,
  PropertyCommitter,
  RenderOptions,
  noChange,
  isDirective,
} from 'lit-html';

import { FxElement } from './element';
import { FxRef, isRef, toRawValue } from './reactive';
import { isFunction, mapObject, isObject } from './shared';

const noop = () => {};

// No need to use the commit function, we just assume the value is a static string
// Detect if native element or custom element, if native then bind like vuejs does
class SyncPart implements Part {
  private readonly castNumber: boolean = false;
  private readonly trimValue: boolean = false;
  private ref: FxRef;
  readonly element: Element;
  readonly value: unknown;
  readonly commit: () => void;

  // *[value.number.trim.lazy]=${ref}
  constructor(element: Element, key: string) {
    let [ prop, ...mods ] = key.split('.');
    let event: string;
    let handler: () => any;

    this.element = element;
    this.commit = () => {
      this.element[prop] = this.ref.value;
    };

    // bind to default model, like form fields or using the model object on instance
    // This sets value on the fx from child
    if (prop === '') {
      const tag = element.tagName.toLowerCase();
      const type = (element as HTMLInputElement).type;
      const isInput = tag == 'input';

      if (tag == 'select') {
        event = 'change';
        handler = this.selectHandler;
        this.commit = this.selectCommit;
      } else if (isInput && type == 'checkbox') {
        event = 'change';
        handler = this.checkboxHandler;
        this.commit = this.checkboxCommit;
      } else if (isInput && type == 'radio') {
        event = 'change';
        prop = 'value';
        this.commit = this.radioCommit;
      } else if (isInput || tag == 'textarea') {
        // lazy modifier
        event = mods.includes('lazy') ? 'change' : 'input';
        prop = 'value';
      } else if (element instanceof FxElement) {
        event = element._ctx.model.event;
        prop = element._ctx.model.prop;
      } else {
        throw new Error(`Model not supported for element '${tag}'.`);
      }
    }

    const castNumber = mods.includes('number');
    const trimValue = mods.includes('trim');
    const listener = (e: Event) => {
      e.stopPropagation();
      let value = isFunction(handler) ? handler() : this.element[prop];

      // Cast value if we need to
      if (typeof value == 'string') {
        if (trimValue) {
          value = value.trim();
        }

        if (castNumber) {
          const num = parseFloat(value);

          if (!isNaN(num)) {
            value = num;
          }
        }
      }

      this.ref.value = value;
    };

    element.addEventListener(event ?? `fxsync:${prop}`, listener, false);
  }

  /**
   * Sets the ref value for this part
   */
  setValue(ref: FxRef): void {
    if (!isRef(ref)) {
      throw new TypeError('Sync attributes values requires a ref as their value!');
    }

    this.ref = ref;
  }

  // Handlers
  private selectHandler(): string | string[] {
    const element = this.element as HTMLSelectElement;
    const options = element.selectedOptions;
    let value: string | string[];

    if (element.multiple) {
      value = !options.length ? [] : Array.from(options).map(o => o.value);
    } else {
      value = options[0]?.value;
    }

    return value;
  }
  private selectCommit(): void {
    const element = this.element as HTMLSelectElement;
    const { options } = element;
    const value = this.value;

    if (element.multiple) {
      const values = value as string[];

      // No child options rendered in select if dynamic
      // Not mounted from documentfragment until committing is done on all parts
      // The content of the node stored in a NodePart comes after model definition
      // Find a way to wait for all nodes to be committed before commiting SyncModel part.
      // Problem doesnt arise on non dynamic content, only on dynamic.

      // @ts-ignore
      for (let o of options) {
        o.selected = values.includes(o.value);
      }
    } else {
      // @ts-ignore
      for (let o of options) {
        o.selected = o.value === value;
      }
    }
  }

  private radioCommit(): void {
    const element = this.element as HTMLInputElement;
    element.checked = this.ref.value === element.value;
  }

  private checkboxHandler(): boolean | string | string[] {
    const element = this.element as HTMLInputElement;
    const list: FxRef<string> = this.ref.value;
    const { value, checked } = element;

    if (Array.isArray(list)) {
      const idx = list.indexOf(value);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push(value);
      }

      return list;
    }

    return value ?? checked;
  }
  private checkboxCommit(): void {
    const element = this.element as HTMLInputElement;
    const value = this.ref.value;

    if (Array.isArray(value)) {
      const values = value;
      element.checked = values.includes(element.value);
    } else {
      element.checked = value === element.value;
    }
  }
}

// If a reactive object, ref or computed is sent as a value
// we need to resolve the raw value from it
class FxNodePart extends NodePart {
  setValue(value: unknown): void {
    super.setValue(toRawValue(value));
  }
}

class FxAttributePart extends AttributePart {
  readonly name: string;

  constructor(committer: AttributeCommitter, name: string) {
    super(committer);
    this.name = name;
  }

  setValue(value: unknown): void {
    let raw = toRawValue(value);

    if (this.name == 'class') {
      if (Array.isArray(raw)) {
        raw = raw.filter(x => x).join(' ');
      } else if (isObject(raw)) {
        raw = Object.entries(raw).reduce((acc, [ key, value ]) => {
          value && acc.push(key);

          return acc;
        }, []).join(' ');
      }
    }

    super.setValue(raw);
  }
}

class FxBooleanAttributePart extends BooleanAttributePart {
  setValue(value: unknown): void {
    super.setValue(toRawValue(value));
  }
}

class FxAttributeCommitter extends AttributeCommitter {
  protected _createPart(): AttributePart {
    return new FxAttributePart(this, this.name);
  }
}

class FxPropertyCommitter extends PropertyCommitter {
  protected _createPart(): AttributePart {
    return new FxAttributePart(this, null);
  }
}

type EventListener = (e: Event) => any;
class FxEventPart implements Part {
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

class ConditionalAttributePart implements Part {
  readonly element: Element;
  readonly name: string;
  readonly strings: ReadonlyArray<string>;
  value: unknown = undefined;
  private __pendingValue: unknown = undefined;
  private comment: Comment;

  constructor(element: Element, name: string, strings: ReadonlyArray<string>) {
    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error(
          'Conditional attributes can only contain a single expression');
    }

    this.element = element;
    this.name = name;
    this.strings = strings;
    this.comment = document.createComment('');
  }

  setValue(value: unknown): void {
    this.__pendingValue = toRawValue(value);
  }

  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue;
      this.__pendingValue = noChange;
      directive(this);
    }

    if (this.__pendingValue === noChange) {
      return;
    }

    const { element, comment } = this;
    const pending = !!this.__pendingValue;
    const value = this.name == 'not' ? !pending : pending;

    if (this.value !== value) {
      const oldChild = value ? comment : element;
      const newChild = value ? element : comment;

      oldChild.parentNode?.replaceChild(newChild, oldChild);
      this.value = value;
    }

    this.__pendingValue = noChange;
  }
}

class BindPart implements Part {
  readonly element: Element;
  readonly name: string;
  readonly strings: ReadonlyArray<string>;
  value: unknown = undefined;

  constructor(element: Element, name: string, strings: ReadonlyArray<string>) {
    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error(
          'Conditional attributes can only contain a single expression');
    }

    this.element = element;
    this.name = name;
    this.strings = strings;
  }

  setValue(value: unknown): void {
    if (!isObject(value)) {
      throw new TypeError('Bind can only work with Object');
    }

    this.value = value;
  }

  commit() {
    Object.entries(this.value).forEach(([key, value]) => {
      if (value) {
        this.element.setAttribute(key, value.toString());
      } else {
        this.element.removeAttribute(key);
      }
    });
  }
}

export const parts: Map<string, Function> = new Map([
  ['.', (element: Element, name: string, strings: ReadonlyArray<string>): readonly Part[] => {
    const committer = new FxPropertyCommitter(element, name, strings);
    return committer.parts;
  }],
  ['@', (element: Element, name: string, strings: ReadonlyArray<string>, options: RenderOptions): readonly Part[] => {
    return [new FxEventPart(element, name, options.eventContext)];
  }],
  ['?', (element: Element, name: string, strings: ReadonlyArray<string>): readonly Part[] => {
    return [new FxBooleanAttributePart(element, name, strings)];
  }],
  ['&', (element: Element, name: string): readonly Part[] => {
    return [new SyncPart(element, name)];
  }],
  ['!', (element: Element, name: string, strings: ReadonlyArray<string>): readonly Part[] => {
    return [new ConditionalAttributePart(element, name, strings)];
  }],
  [':', (element: Element, name: string, strings: ReadonlyArray<string>): readonly Part[] => {
    return [new BindPart(element, name, strings)];
  }],
]);

/**
 * Creates Parts when a template is instantiated.
 */
export class FxTemplateProcessor implements TemplateProcessor {
  handleAttributeExpressions(
    element: Element,
    name: string,
    strings: ReadonlyArray<string>,
    options: RenderOptions
  ): ReadonlyArray<Part> {
    const prefix = name[0];

    // Get custom part from parts map
    if (parts.has(prefix)) {
      const part = parts.get(prefix);
      return part(element, name.slice(1), strings, options);
    }

    // Default to attribute committer
    const committer = new FxAttributeCommitter(element, name, strings);
    return committer.parts;
  }

  handleTextExpression(options: RenderOptions): NodePart {
    return new FxNodePart(options);
  }
}

export const templateProcessor = new FxTemplateProcessor();
