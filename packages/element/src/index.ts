export { directive } from 'lit-html';
export { defineElement, FxElement } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export * from './reactive';
export * from './lifecycle';
export * from './processor';

import { templateProcessor } from './processor';
import { TemplateResult, SVGTemplateResult } from 'lit-html';

/**
 * Creates a TemplateResult to cache markup, parses content as normal html
 * @param {TemplateStringsArray} strings Template strings
 * @param {*} values Template values
 * @returns {TemplateResult}
 */
export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);

/**
 * Creates a TemplateResult to cache markup, but parses content within an SVG namespace
 * @param {TemplateStringsArray} strings Template strings
 * @param {*} values Template values
 * @returns {TemplateResult}
 */
export const svg = (strings, ...values) => new SVGTemplateResult(strings, values, 'svg', templateProcessor);
