export * from '@shlim/fx';
export { html, svg } from '@shlim/html';
export { defineElement, FxElement, elementInstances } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export * from './lifecycle';


// import directives
import './directives/bind';
import './directives/conditional';
import './directives/on';
import './directives/ref';
import './directives/show';
import './directives/sync';

/**
 * Creates a TemplateResult to cache markup, parses content as normal html
 * @param {TemplateStringsArray} strings Template strings
 * @param {*} values Template values
 * @returns {TemplateResult}
 *
export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);

/**
 * Creates a TemplateResult to cache markup, but parses content within an SVG namespace
 * @param {TemplateStringsArray} strings Template strings
 * @param {*} values Template values
 * @returns {TemplateResult}
 *
export const svg = (strings, ...values) => new SVGTemplateResult(strings, values, 'svg', templateProcessor);
*/
