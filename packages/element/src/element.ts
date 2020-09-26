import { TriggerOpTypes, trigger, reactive } from '@vue/reactivity';
import { mapObject, isObject } from '@kirei/shared';
import { hyphenate } from '@vue/shared';
import { KireiInstance } from './instance';
import { exception } from './logging';
import { validateProp, normalizeProps } from './props';
import type { CSSResult } from './css';
import type { IKireiElement, ElementOptions, NormalizedElementOptions } from './interfaces';

export { ElementOptions, NormalizedElementOptions };

/**
 * Collects an array of CSSResults into a Set of CSSResults to ensure they are unique
 * @param {CSSResult[]} styles Stylesheets to collect
 * @param {Set} set Set to hold all stylesheets
 * @returns {Set}
 * @private
 */
function collectStyles(styles: CSSResult[], set?: Set<CSSResult>): Set<CSSResult> {
  set = set ?? new Set();
  return styles.reduceRight((set, s) => {
    return Array.isArray(s) ? collectStyles(s, set) : (set.add(s), set);
  }, set);
}

/**
 * Normalizes the raw options object to a more predictable format
 * @param {ElementOptions} options Raw element options
 * @returns {NormalizedElementOptions}
 * @private
 */
export function normalizeOptions(options: ElementOptions): NormalizedElementOptions {
  let { styles, emits } = options;
  const props = options.props ? normalizeProps(options.props) : {};

  if (styles != null) {
    styles = Array.isArray(styles) ? [...collectStyles(styles)] : [styles];
  }

  // Reuse same object to avoid unnecessary GC
  const normalized = options as NormalizedElementOptions;
  normalized.props = props;
  normalized.styles = styles as CSSResult[];
  normalized.closed = !!options.closed;
  normalized.setup = options.setup ?? null;
  normalized.directives = options.directives ?? null;
  normalized.tag = hyphenate(options.name);
  normalized.attrs = mapObject((key) => [hyphenate(key), key], props);
  normalized.attributes = Object.keys(normalized.attrs);

  if (Array.isArray(emits)) {
    normalized.emits = mapObject((key) => [ key, null ], emits);
  } else {
    normalized.emits = isObject(emits) ? emits : {};
  }

  return normalized;
}

// HTMLElement needs ES6 classes to instansiate properly
/**
 * Element to use custom elements functionality, as it required a class
 * @class
 */
export class KireiElement extends HTMLElement implements IKireiElement {
  /**
   * Options for this element, used for creating Kirei instances
   * @var {NormalizedElementOptions}
   */
  static options: NormalizedElementOptions;

  /**
   * Returns the tagName of the element
   * @type {string}
   * @static
   */
  static get is(): string {
    return this.options.tag;
  }

  /**
   * The attributes to observe changes for
   * @type {string[]}
   * @static
   */
  static get observedAttributes(): string[] {
    return this.options.attributes;
  }

  /**
   * Constructs a new KireiElement
   */
  constructor() {
    super();
    const { options } = this.constructor as typeof KireiElement;
    const instance = new KireiInstance(this, options);
    const { props } = instance;

    // Set props on the element
    // Set props as getters/setters on element
    // props should be a readonly reactive object
    for (const key of Object.keys(options.props)) {
      // If prop already exists, then we throw error
      if (this.hasOwnProperty(key)) {
        exception(`Prop ${key} is reserved, please use another.`);
      }

      Object.defineProperty(this, key, {
        get: () => props[key],
        set(newValue) {
          if (newValue !== props[key]) {
            try {
              // Trigger an update on the element
              instance.activate();

              const value = validateProp(options.props[key], key, newValue);
              props[key] = isObject(value) ? reactive(value) : value;
              trigger(props, TriggerOpTypes.SET, key, newValue);
            } catch (ex) {
              exception(ex);
            } finally {
              instance.deactivate();
            }
          }
        },
      });
    }
  }

  /**
   * Runs when mounted from DOM
   * @returns {void}
   */
  connectedCallback(): void {
    const instance = KireiInstance.get(this);
    instance.mount();
  }

  /**
   * Runs when unmounted from DOM
   * @returns {void}
   */
  disconnectedCallback(): void {
    const instance = KireiInstance.get(this);
    instance.unmount();
  }

  /**
   * Observes attribute changes, triggers updates on props
   * @returns {void}
   */
  attributeChangedCallback(attr: string, oldValue: string, newValue: string): void {
    // newValue & oldValue null if not set, string if set, default to empty string
    if (oldValue !== newValue) {
      const { options } = this.constructor as typeof KireiElement;
      const key = options.attrs[attr];
      this[key] = newValue;
    }
  }
}
