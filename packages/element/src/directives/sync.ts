import { FxElement, elementInstances } from '../instance';
import { Ref, isRef } from '@shlim/fx';
import { directive, Directive } from '../compiler';
import { nextTick } from '../queue';

function selectHandler(el: HTMLSelectElement, ref: Ref): string | string[] {
  const options = el.selectedOptions;
  if (el.multiple) {
    return !options.length ? [] : Array.from(options).map(o => o.value);
  }

  return options[0]?.value;
}
async function selectCommit(el: HTMLSelectElement, ref: Ref): Promise<void> {
  const { options } = el;
  const value = ref.value;

  // Synced select elements has to be committed on the nextTick.
  // As dynamic content could have not loaded yet.
  // Another solution is to execute all attribute patches last, but is more cumbersome.
  await nextTick();
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

function radioCommit(el: HTMLInputElement, ref: Ref): void {
  el.checked = ref.value === el.value;
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
function checkboxCommit(el: HTMLInputElement, ref: Ref): void {
  const value = ref.value;

  if (Array.isArray(value)) {
    const values = value;
    el.checked = values.includes(el.value);
  } else {
    el.checked = value === el.value;
  }
}

function mutationHandlers(dir: Directive) {
  const { el, arg, mods } = dir;
  let eventName: string;
  let prop: string = arg;
  let handler: (el: HTMLElement, ref: Ref) => any;
  let commit = (el: HTMLElement, ref: Ref) => {
    el[prop] = ref.value;
  };

  // bind to default sync, like form fields or using the sync name on instance
  // This sets value on the fx from child
  if (prop === '') {
    const tag = el.tagName.toLowerCase();
    const type = (el as HTMLInputElement).type;
    const isInput = tag == 'input';

    if (tag == 'select') {
      eventName = 'change';
      handler = selectHandler;
      commit = selectCommit;
    } else if (isInput && type == 'checkbox') {
      eventName = 'change';
      handler = checkboxHandler;
      commit = checkboxCommit;
    } else if (isInput && type == 'radio') {
      eventName = 'change';
      prop = 'value';
      commit = radioCommit;
    } else if (isInput || tag == 'textarea') {
      // lazy modifier only for text input
      eventName = mods.includes('lazy') ? 'change' : 'input';
      prop = 'value';
    } else {
      const instance = elementInstances.get(el as FxElement);
      if (instance) {
        prop = instance.options.sync;
      } else {
        throw new Error(`Default syncing not supported for element '${tag}'.`);
      }
    }
  }

  return { commit, handler, prop, eventName };
}

// directive format &[value.number.trim.lazy]=${ref}
directive('&', dir => {
  const { el, mods } = dir;
  const { commit, handler, prop, eventName } = mutationHandlers(dir);
  const castNumber = mods.includes('number');
  const trimValue = mods.includes('trim');
  let ref: Ref;

  el.addEventListener(eventName ?? `fxsync::${prop}`, (e: Event) => {
    e.stopPropagation();
    let value = handler?.(el, ref) ?? (e instanceof CustomEvent ? e.detail : el[prop]);

    // Cast value if set
    if (typeof value == 'string') {
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
  }, false);

  return (newRef: Ref) => {
    if (!isRef(newRef)) {
      throw new TypeError('Sync directive requires a ref as it\'s value');
    }

    ref = newRef;
    commit(el, ref);
  };
});
