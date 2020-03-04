export { css } from './CSSResult';
export * from './reactive';
export { defineElement } from './element';
export * from './lifecycle';
export { nextTick } from './queue';
export { directive } from 'lit-html';

import { templateProcessor } from './processor';
import { TemplateResult } from 'lit-html';
export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);
export const svg = (strings, ...values) => new TemplateResult(strings, values, 'svg', templateProcessor);
