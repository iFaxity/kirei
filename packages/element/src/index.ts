export * from '@kirei/fx';
export { FxElement, FxInstance, elementInstances} from './instance';
export { nextTick } from './queue';
export { css } from './css';
export { directive, html, svg } from './compiler';
export * from './api/lifecycle';
export { portal } from './api/portal';
export { InjectionKey, provide, inject } from './api/inject';

// import directives to load them
import './directives/attrs';
import './directives/if';
import './directives/on';
import './directives/ref';
import './directives/show';
import './directives/sync';

// expose defineElement function
import { FxElement, FxOptions, NormalizedFxOptions } from './instance';
import { mapObject, camelToKebab, warn } from '@kirei/shared';
import { CSSResult } from './css';
import { Props, normalizeProps } from './props';

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
 * @param {FxOptions} options Raw element options
 * @returns {NormalizedFxOptions}
 */
function normalizeOptions(options: FxOptions): NormalizedFxOptions {
  let { styles } = options;
  const props = options.props ? normalizeProps(options.props) : {};

  if (styles != null) {
    styles = Array.isArray(styles) ? [ ...collectStyles(styles) ] : [ styles ];
  }

  const normalized = options as NormalizedFxOptions;
  normalized.props = props;
  normalized.styles = styles as CSSResult[];
  normalized.closed = options.closed ?? false;
  normalized.sync = options.sync ?? 'value';
  normalized.setup = options.setup ?? null;
  normalized.directives = options.directives ?? null;
  normalized.tag = camelToKebab(options.name);
  normalized.attrs = mapObject((key) => [ camelToKebab(key), key ], props);
  return normalized;
}

/**
 * Defines a new custom shlim element
 * @param {FxOptions} options - Raw element options
 * @returns {FxElement}
 */
export function defineElement<T extends Readonly<Props>>(options: FxOptions<T>): typeof FxElement {
  const normalized = normalizeOptions(options);
  const attrs = Object.keys(normalized.attrs);

  if (!normalized.tag.includes('-')) {
    warn('Element names should include a hyphen (-) or be camelised with at least 2 upper-case characters', options.name);
  }

  // if custom element already defined, then swap instances,
  // then force hydrate the instances.
  const CustomElement = class extends FxElement {
    static get is() {
      return normalized.tag;
    }

    static get observedAttributes() {
      return attrs;
    }

    constructor() {
      super(normalized);
    }
  };

  window.customElements.define(normalized.tag, CustomElement);
  return CustomElement;
}
