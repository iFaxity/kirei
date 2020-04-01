import { toRawValue } from '@shlim/fx';
import { createLiteral } from '@shlim/html';
import { compiler } from './directive';

export * from '@shlim/fx';
export { defineElement, FxElement, elementInstances } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export { directive } from './directive';
export * from './lifecycle';

// define default directives
import './directives/attrs';
import './directives/if';
import './directives/on';
import './directives/ref';
import './directives/show';
import './directives/sync';

// Customize literal to unpack reactives
export const html = createLiteral('html', compiler, toRawValue);
export const svg = createLiteral('svg', compiler, toRawValue);
