export { directive } from 'lit-html';
export { defineElement, FxElement } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export * from './reactive';
export * from './lifecycle';
export * from './processor';

import { templateProcessor } from './processor';
import { TemplateResult } from 'lit-html';

/**
 * 
 * @param {TemplateStringsArray} strings 
 * @param {*} values 
 * @returns {TemplateResult}
 */
export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);

/**
 * 
 * @param {TemplateStringsArray} strings
 * @param {*} values
 * @returns {TemplateResult}
 */
export const svg = (strings, ...values) => new TemplateResult(strings, values, 'svg', templateProcessor);
