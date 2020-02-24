import { templateProcessor } from './processor';
import { TemplateResult } from 'lit-html';
export * from './reactive';
export { defineElement } from './element';
export * from './lifecycle';

export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);
export const svg = (strings, ...values) => new TemplateResult(strings, values, 'svg', templateProcessor);
