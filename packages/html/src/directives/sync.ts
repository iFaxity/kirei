import { FxElement, elementInstances } from '@shlim/element';
import { Ref, isRef } from '@shlim/fx';
import { isFunction } from '@shlim/shared';
import { directive, Directive } from './';




function selectHandler(el: HTMLSelectElement, ref: Ref): string | string[] {
  const options = el.selectedOptions;
  if (el.multiple) {
    return !options.length ? [] : Array.from(options).map(o => o.value);
  }

  return options[0]?.value;
}
function selectCommit(el: HTMLSelectElement, ref: Ref): void {
  const { options } = el;
  const value = ref.value;

  // TODO: No child options rendered in select if dynamic
  //   Not mounted from documentfragment until committing is done on all parts
  //   The content of the node stored in a NodePart comes after model definition
  //   Find a way to wait for all nodes to be committed before commiting SyncModel part.
  //   Problem doesnt arise on non dynamic content, only on dynamic.

  if (el.multiple) {
    const values = value as string[];
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
  let commit = (el: HTMLElement, ref: Ref) => { el[arg] = ref.value; };

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
    } else if (el instanceof FxElement) {
      const instance = elementInstances.get(el);
      prop = instance.options.sync;
    } else {
      throw new Error(`Default syncing not supported for element '${tag}'.`);
    }
  }

  return { commit, handler, prop, eventName };
}

// directive format v-sync[value.number.trim.lazy]=${ref}
directive('sync', dir => {
  const { el, mods } = dir;
  const { commit, handler, prop, eventName } = mutationHandlers(dir);
  const castNumber = mods.includes('number');
  const trimValue = mods.includes('trim');
  let ref: Ref;

  el.addEventListener(eventName ?? `fxsync::${prop}`, (e: Event) => {
    e.stopPropagation();

    let value: any;
    if (isFunction(handler)) {
      value = handler.call(this, el, ref);
    } else {
      value = 'detail' in e ? (e as CustomEvent).detail : el[prop];
    }

    // Cast value if set
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

    ref.value = value;
  }, false);

  return (newValue: Ref) => {
    if (isRef(newValue)) {
      throw new TypeError('Sync directive requires a ref as it\'s value');
    }

    ref = newValue;
    commit(el, ref);
  };
});
