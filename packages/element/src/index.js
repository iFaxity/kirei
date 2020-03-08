export { directive } from 'lit-html';
export { defineElement } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export * from './reactive';
export * from './lifecycle';
export * from './processor';
import { templateProcessor } from './processor';
import { TemplateResult } from 'lit-html';
export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);
export const svg = (strings, ...values) => new TemplateResult(strings, values, 'svg', templateProcessor);
//# sourceMappingURL=index.js.map