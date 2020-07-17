export * from '@kirei/fx';
export { KireiElement, KireiInstance, instances } from './instance';
export { nextTick } from './queue';
export { css } from './css';
export { directive, html, svg } from './compiler';
export * from './api/lifecycle';
export { portal } from './api/portal';
export { InjectionKey, provide, inject } from './api/inject';

// expose defineElement function
import { KireiElement, ElementOptions, NormalizedElementOptions, SyncOptions } from './instance';
import { mapObject, camelToKebab, warn, isObject, isString } from '@kirei/shared';
import { CSSResult } from './css';
import { Props, normalizeProps } from './props';

// load directives
import './directives/attrs';
import './directives/if';
import './directives/on';
import './directives/ref';
import './directives/show';
import './directives/sync';

/**
 * Collects an array of CSSResults into a Set of CSSResults to ensure they are unique
 * @param {CSSResult[]} styles Stylesheets to collect
 * @param {Set} set Set to hold all stylesheets
 * @returns {Set}
 */
function collectStyles(styles: CSSResult[], set?: Set<CSSResult>): Set<CSSResult> {
  set = set ?? new Set<CSSResult>();
  return styles.reduceRight((set, s) => Array.isArray(s) ? collectStyles(s, set) : (set.add(s), set), set);
}

/**
 * Normalizes the raw options object to a more predictable format
 * @param {ElementOptions} options Raw element options
 * @returns {NormalizedElementOptions}
 */
function normalizeOptions(options: ElementOptions): NormalizedElementOptions {
  let { sync, styles } = options;
  const props = options.props ? normalizeProps(options.props) : {};

  if (styles != null) {
    styles = Array.isArray(styles) ? [ ...collectStyles(styles) ] : [ styles ];
  }

  if (isString(sync)) {
    sync = { prop: sync, event: null };
  } else if (isObject(sync)) {
    sync.prop = isString(sync.prop) ? sync.prop : 'value';
    sync.event = isString(sync.event) ? sync.event : null;
  }

  // Reuse same object to avoid unnecessary GC
  const normalized = options as NormalizedElementOptions;
  normalized.props = props;
  normalized.styles = styles as CSSResult[];
  normalized.closed = options.closed ?? false;
  normalized.sync = sync as SyncOptions;
  normalized.setup = options.setup ?? null;
  normalized.directives = options.directives ?? null;
  normalized.tag = camelToKebab(options.name);
  normalized.attrs = mapObject((key) => [ camelToKebab(key), key ], props);
  return normalized;
}

/**
 * Defines a new custom Kirei element
 * @param {ElementOptions} options - Raw element options
 * @returns {KireiElement}
 */
export function defineElement<T extends Readonly<Props>>(options: ElementOptions<T>): typeof KireiElement {
  const normalized = normalizeOptions(options);
  if (!normalized.tag.includes('-')) {
    warn('Element names should include a hyphen (-) or be Pascal/camelCased with at least 1-2 upper-case character', options.name);
  }

  // TODO HMR, override options, then reflow all mounted elements
  // However element state cannot be saved this way.
  // if already defined then just override options
  const CustomElement = class extends KireiElement {
    static options = normalized;
  };

  window.customElements.define(CustomElement.is, CustomElement);
  return CustomElement;
}
