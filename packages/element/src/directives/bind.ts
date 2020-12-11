import { isObject } from '@kirei/shared';
import type { TemplatePatcher } from '@kirei/html';
import { warn } from '../logging';

export function bind(el: HTMLElement, arg: string, modifiers: string[]): TemplatePatcher {
  let attributes: string[] = [];

  return (pending) => {
    if (!isObject(pending)) {
      return warn('Directive requires the expression value to be an object', 'attrs (directive)');
    }

    const keys = Object.keys(pending);
    const unique = new Set([ ...keys, ...attributes ]);

    for (const key of unique) {
      const value = pending[key];

      value ? el.setAttribute(key, value) : el.removeAttribute(key);
    }

    attributes = keys;
  };
}
