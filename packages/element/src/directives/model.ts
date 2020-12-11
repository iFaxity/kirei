import { isString } from '@kirei/shared';
import { isRef } from '@vue/reactivity';
import type { Ref } from '@vue/reactivity';
import type { TemplatePatcher } from '@kirei/html';
import type { DirectiveBinding } from '../compiler';
import { push } from '../queue';
import { KireiInstance } from '../instance';

const DEFAULT_PROP = 'modelValue';

function selectHandler(el: HTMLSelectElement): string | string[] {
  const options = el.selectedOptions;
  if (el.multiple) {
    return !options.length ? [] : Array.from(options).map(o => o.value);
  }

  return options[0]?.value;
}

function selectCommit(el: HTMLSelectElement, value: unknown): void {
  const { options } = el;

  if (el.multiple) {
    const values = value as string[];

    for (let i = 0; i < options.length; i++) {
      const o = options[i];
      o.selected = values.includes(o.value);
    }
  } else {
    for (let i = 0; i < options.length; i++) {
      const o = options[i];
      o.selected = value === o.value;
    }
  }
}

function radioCommit(el: HTMLInputElement, value: unknown): void {
  el.checked = value === el.value;
}

function checkboxHandler(el: HTMLInputElement, ref: Ref): boolean | string | string[] {
  const list = ref.value;
  if (Array.isArray(list)) {
    const idx = list.indexOf(el.value);

    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(el.value);
    }

    return list;
  }

  // TODO: dont return 'value' if not list
  //return el.value || el.checked;
  //return el.hasAttribute('value') ? el.value : el.checked;
  return el.checked;
}
function checkboxCommit(el: HTMLInputElement, value: unknown): void {
  /*let state = !!value;
  if (el.hasAttribute('value')) {
    state = Array.isArray(value) ? value.includes(el.value) : value === el.value;
  }
  el.checked = state;*/
  // NOTE: see the handler for more info on why no value without list
  el.checked = Array.isArray(value) ? value.includes(el.value) : !!value;
}

function castValue(value: unknown, trim: boolean, number: boolean): unknown {
  // Cast value if set
  if (isString(value)) {
    if (trim) {
      value = value.trim();
    }

    if (number) {
      const num = parseFloat(value as string);

      if (!isNaN(num)) {
        value = num;
      }
    }
  }

  return value;
}

function nativeModel(el: HTMLElement, arg: string, modifiers: string[]): TemplatePatcher {
  const castNumber = modifiers.includes('number');
  const trimValue = modifiers.includes('trim');

  let ref: Ref;
  let event: string;
  let prop: string = arg;
  let handler: (el: Element, ref: Ref) => any;
  let commit: (el: Element, value: unknown) => void;

  // Bind to default model, like form fields
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type;
  const isInput = tag == 'input';

  if (tag == 'select') {
    event = 'change';
    handler = selectHandler;
    commit = selectCommit;
  } else if (isInput && type == 'checkbox') {
    event = 'change';
    handler = checkboxHandler;
    commit = checkboxCommit;
  } else if (isInput && type == 'radio') {
    event = 'change';
    prop = 'value';
    commit = radioCommit;
  } else if (isInput || tag == 'textarea') {
    // lazy modifier only for text input
    event = modifiers.includes('lazy') ? 'change' : 'input';
    prop = 'value';
    commit = (el, value) => { el[prop] = value; };
  } else {
    throw new TypeError(`Model not supported for element '${tag}'.`);
  }

  function listener(e: Event) {
    e.stopPropagation();
    const value = handler ? handler(el, ref) : el[prop];

    ref.value = castValue(value, trimValue, castNumber);
  }

  // Bind listener to event name
  el.addEventListener(event, listener, false);

  return (pending) => {
    if (!isRef(pending)) {
      throw new TypeError(`Model directive requires a ref as its value`);
    }

    // Synced select elements has to be committed on the nextTick.
    // As dynamic content could have not loaded yet.
    // TODO. applies to all elements, as syncing happening in queue now instead
    ref = pending;

    // required to trigger dep, has to be sync
    const value = ref.value;
    push(() => commit(el, value));
  };
}

// directive format &[value.number.trim.lazy]=${ref}
export function model(el: HTMLElement, arg: string, modifiers: string[]): TemplatePatcher {
  const instance = KireiInstance.get(el);

  // TODO: if instance, pass as prop (update:propName)
  if (instance) {
    const castNumber = modifiers.includes('number');
    const trimValue = modifiers.includes('trim');
    const prop = arg || DEFAULT_PROP;
    let ref: Ref;

    instance.on(`update:${prop}`, (value) => { ref.value = value; });

    return (pending) => {
      if (!isRef(pending)) {
        throw new TypeError(`Model directive requires a ref as its value`);
      }

      // Synced select elements has to be committed on the nextTick.
      // As dynamic content could have not loaded yet.
      // TODO. applies to all elements, as syncing happening in queue now instead
      ref = pending;
      instance.props[prop] = castValue(ref.value, trimValue, castNumber);
    };
  } else if (arg === '') {
    return nativeModel(el, arg, modifiers);
  }

  throw new TypeError(`Custom Model only supported for Kirei elements, got '${el.tagName.toLowerCase()}'.`);
}
