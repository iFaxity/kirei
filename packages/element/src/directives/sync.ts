import { isString } from '@kirei/shared';
import { Ref, isRef } from '@vue/reactivity';
import { KireiInstance } from '../instance';
import { directive, Directive } from '../compiler';
import { push } from '../queue';
import { IKireiElement } from '../interfaces';

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

  return el.value ?? el.checked;
}
function checkboxCommit(el: HTMLInputElement, value: unknown): void {
  if (Array.isArray(value)) {
    const values = value;
    el.checked = values.includes(el.value);
  } else {
    el.checked = value === el.value;
  }
}

function mutationHandlers(dir: Directive) {
  const { el, arg, mods } = dir;
  let event: string;
  let prop: string = arg;
  let handler: (el: Element, ref: Ref) => any;
  let commit = (el: Element, value: unknown) => {
    el[prop] = value;
  };
  let sync = false;

  // bind to default sync, like form fields or using the sync name on instance
  // This sets value on the fx from child
  if (prop === '') {
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
      event = mods.includes('lazy') ? 'change' : 'input';
      prop = 'value';
    } else {
      const instance = KireiInstance.get(el as IKireiElement);

      if (instance) {
        sync = true;
        event = instance.options.sync.event;
        prop = instance.options.sync.prop;
      } else {
        throw new TypeError(`Default syncing not supported for element '${tag}'.`);
      }
    }
  }

  return { commit, handler, prop, event, sync };
}

// directive format &[value.number.trim.lazy]=${ref}
export default directive('&', dir => {
  const { el, mods } = dir;
  const { commit, handler, prop, event, sync } = mutationHandlers(dir);
  const castNumber = mods.includes('number');
  const trimValue = mods.includes('trim');
  let ref: Ref;

  function listener(e: Event) {
    e.stopPropagation();
    let value = handler?.(el, ref) ?? (e instanceof CustomEvent ? e.detail : el[prop]);

    // Cast value if set
    if (isString(value)) {
      if (castNumber) {
        const num = parseFloat(value);

        if (!isNaN(num)) {
          value = num;
        }
      } else if (trimValue) {
        value = value.trim();
      }
    }

    ref.value = value;
  }

  // Only bind to event name if defined
  // Sync event always binds when kirei element sync is defined
  // Custom event name for kirei elements is for compatability with non kirei elements
  event && el.addEventListener(event, listener, false);
  if (sync || !event) {
    el.addEventListener(`fxsync::${prop}`, listener, false);
  }

  return (pending: Ref<any>) => {
    if (!isRef(pending)) {
      throw new TypeError(`Sync directive requires a ref as its value`);
    }

    // Synced select elements has to be committed on the nextTick.
    // As dynamic content could have not loaded yet.
    // TODO. applies to all elements, asyncing happening in queue now instead
    ref = pending;
    const value = ref.value;
    push(() => commit(el, value));
  };
});
