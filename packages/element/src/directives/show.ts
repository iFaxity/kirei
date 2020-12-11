import { unref } from '@vue/reactivity';
import type { TemplatePatcher } from '@kirei/html';

export function show(el: HTMLElement, arg: string, modifiers: string[]): TemplatePatcher {
  let value = true;

  return (pending) => {
    const newValue = !!unref(pending);
    if (newValue != value) {
      el.style.display = newValue ? '' : 'none';
    }

    value = newValue;
  };
}
