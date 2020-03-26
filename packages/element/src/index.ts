export * from '@shlim/fx';
export { html, svg } from '@shlim/html';
export { defineElement, FxElement, elementInstances } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export * from './lifecycle';
export * from './directive';

// define default directives
import './directives/bind';
import './directives/conditional';
import './directives/on';
import './directives/ref';
import './directives/show';
import './directives/sync';
