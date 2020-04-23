export * from '@kirei/fx';
export { defineElement, FxElement, FxInstance, elementInstances } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export { directive, html, svg } from './compiler';
export * from './api/lifecycle';
export { portal } from './api/portal';
export { InjectionKey, provide, inject } from './api/inject';

// define default directives
import './directives/attrs';
import './directives/if';
import './directives/on';
import './directives/ref';
import './directives/show';
import './directives/sync';
