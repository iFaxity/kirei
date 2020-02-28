import { TemplateResult, directive, isDirective, Part } from 'lit-html';
import { templateProcessor, parts } from './processor';
export * from './reactive';
export { defineElement } from './element';
export * from './lifecycle';
export { nextTick } from './queue';

export { directive };

export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);
export const svg = (strings, ...values) => new TemplateResult(strings, values, 'svg', templateProcessor);

// Expose a global object to dynamically add features
// like directives and parts
interface Fx {
  directive(fn: (...args) => void): void;
  part(key: string, part: () => Part): void;
}

declare global {
  interface Window {
    Fx: Fx;
  }
}

if (window && !window.Fx) {
  window.Fx = {
    directive(fn) {
      return isDirective(fn) ? fn : directive(fn);
    },
    part(key, part) {
      if (key.length == 0) {
        throw new TypeError('Part key has to be one character only');
      }

      parts.set(key, part);
    }
  };
}
