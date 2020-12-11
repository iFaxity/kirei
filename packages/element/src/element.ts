import { trigger, reactive } from '@vue/reactivity';
import type { TriggerOpTypes } from '@vue/reactivity';
import { mapObject, isObject } from '@kirei/shared';
import { hyphenate } from '@vue/shared';
import { KireiInstance, setCurrentInstance } from './instance';
import { exception } from './logging';
import { validateProp, normalizeProps } from './props';
import type { CSSResult } from './css';
import type { IKireiElement, ElementOptions, NormalizedElementOptions } from './interfaces';
import { nextTick } from './queue';

/**
 * Collects an array of CSSResults into a Set of CSSResults to ensure they are unique
 * @param styles - Stylesheets to collect
 * @param set - Set to hold all stylesheets
 * @returns A set of unique CSS Stylesheets
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
 * @param options - Raw element options
 * @returns The normalized options
 * @private
 */
export function normalizeOptions(options: ElementOptions): NormalizedElementOptions {
  const { styles, emits, directives } = options;
  const props = options.props ? normalizeProps(options.props) : {};

  // Reuse same object to avoid unnecessary GC
  const normalized = options as NormalizedElementOptions;
  normalized.props = props;
  normalized.closed = !!options.closed;
  normalized.setup = options.setup ?? null;
  normalized.tag = hyphenate(options.name);
  normalized.attrs = mapObject((key) => [hyphenate(key), key], props);
  normalized.attributes = Object.keys(normalized.attrs);

  if (styles != null) {
    normalized.styles = Array.isArray(styles) ? [...collectStyles(styles)] : [styles];
  }

  if (directives != null) {
    normalized.directives = mapObject((key, value) => [hyphenate(key), value], directives);
  }

  if (Array.isArray(emits)) {
    normalized.emits = mapObject((key) => [key, null], emits);
  } else {
    normalized.emits = isObject(emits) ? emits : {};
  }

  return normalized;
}

/**
 * Element to use custom elements functionality, as it required a class
 */
export class KireiElement extends HTMLElement implements IKireiElement {
  /**
   * Options for this element, used for creating Kirei instances
   */
  static options: NormalizedElementOptions;

  /**
   * Returns the tagName of the element
   * @static
   */
  static get is(): string {
    return this.options.tag;
  }

  /**
   * The attributes to observe changes for
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
              setCurrentInstance(instance);

              const value = validateProp(options.props[key], key, newValue);
              props[key] = isObject(value) ? reactive(value) : value;
              trigger(props, 'set' as TriggerOpTypes, key, newValue);
            } catch (ex) {
              exception(ex);
            } finally {
              setCurrentInstance(null);
            }
          }
        },
      });
    }
  }

  /**
   * Runs when mounted from DOM
   */
  connectedCallback(): void {
    const instance = KireiInstance.get(this);
    // to leave teh app to get a chance to mount, push the connect to next paint cycle
    nextTick(() => instance.mount());
  }

  /**
   * Runs when unmounted from DOM
   */
  disconnectedCallback(): void {
    const instance = KireiInstance.get(this);
    instance.unmount();
  }

  /**
   * Observes attribute changes, triggers updates on props
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
