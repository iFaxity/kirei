export * from '@vue/reactivity';
export { setCurrentInstance, getCurrentInstance } from './runtime/instance';
export { Component, normalizeOptions } from './runtime/component';
export { nextTick } from './runtime/queue';
export { css, CSSResult } from './runtime/css';
export { html, svg } from './runtime/compiler';
export * from './api/defineComponent';
export * from './api/lifecycle';
export * from './api/inject';
export * from './api/portal';
export * from './api/watch';
export * from './api/app';
export type { ComponentOptions, ComponentInstance, UnwrapNestedRefs } from './types';
export type { StyleSheet } from './runtime/css';


// experimental components
export * from './api/portal';
//export * from './api/suspense';
