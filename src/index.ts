import { TemplateResult, directive } from 'lit-html';
import { templateProcessor } from './processor';
export * from './reactive';
export { defineElement } from './element';
export * from './lifecycle';
export { nextTick } from './queue';

export { directive };

export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);
export const svg = (strings, ...values) => new TemplateResult(strings, values, 'svg', templateProcessor);
