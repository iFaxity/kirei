import { Part } from 'lit-html';
import { FxElement, elementInstances } from '../instance';
import { FxRef, isRef } from '../reactive';
import { isFunction } from '../shared';

// Detect if native element or custom element, if native then bind like vuejs does
export class FxSyncPart implements Part {
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
        const instance = elementInstances.get(element);
        event = instance.options.model.event;
        prop = instance.options.model.prop;
      } else {
        throw new Error(`Model not supported for element '${tag}'.`);
      }
    }

    const castNumber = mods.includes('number');
    const trimValue = mods.includes('trim');
    const listener = (e: Event) => {
      e.stopPropagation();
      let value = isFunction(handler) ? handler.call(this) : this.element[prop];

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
    const value = this.ref.value;

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
