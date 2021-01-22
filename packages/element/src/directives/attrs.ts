import type { TemplatePatcher } from '@kirei/html';
import { isObject } from '@kirei/shared';
import { warn } from '../warn';

export function attrs(el: HTMLElement, arg: string, modifiers: string[]): TemplatePatcher {
  return (pending) => {
    if (!isObject(pending)) {
      return warn('Directive requires the expression value to be an object', 'attrs (directive)');
    }

    for (const key of Object.keys(pending)) {
      const value = pending[key];

      value ? el.setAttribute(key, value) : el.removeAttribute(key);
    }
  };
}
