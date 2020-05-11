export * from '@kirei/fx';
export { KireiElement, KireiInstance, instances } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export { directive, html, svg } from './compiler';
export * from './api/lifecycle';
export { portal } from './api/portal';
export { InjectionKey, provide, inject } from './api/inject';
import './directives/attrs';
import './directives/if';
import './directives/on';
import './directives/ref';
import './directives/show';
import './directives/sync';
import { KireiElement, ElementOptions } from './instance';
import { Props } from './props';
/**
 * Defines a new custom Kirei element
 * @param {ElementOptions} options - Raw element options
 * @returns {KireiElement}
 */
export declare function defineElement<T extends Readonly<Props>>(options: ElementOptions<T>): typeof KireiElement;
//# sourceMappingURL=index.d.ts.map