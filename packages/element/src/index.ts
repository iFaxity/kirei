export * from '@shlim/fx';
export { defineElement, FxElement, elementInstances } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export { directive, html, svg } from './compiler';
export * from './lifecycle';
export { portal } from './portal';

// define default directives
import './directives/attrs';
import './directives/if';
import './directives/on';
import './directives/ref';
import './directives/show';
import './directives/sync';
