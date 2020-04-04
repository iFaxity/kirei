import { Template } from '@shlim/html';
import { Fx, TriggerOpTypes, toReactive } from '@shlim/fx';
import { isFunction, mapObject, camelToKebab, warn, exception } from '@shlim/shared';
import { HookTypes } from './lifecycle';
import * as Queue from './queue';
import { CSSResult, shimAdoptedStyleSheets } from './css';
import { render } from './directive';
import {
  Props,
  PropsData,
  ResolvePropTypes,
  NormalizedProps,
  validateProp,
  normalizeProps,
  propDefaults,
} from './props';

export let activeInstance: FxInstance = null;
export const elementInstances = new WeakMap<FxElement, FxInstance>();

export interface FxOptions<P = Props, T = ResolvePropTypes<P>> {
  name: string;
  closed?: boolean;
  props?: P;
  sync?: string;
  setup(this: void, props: T, ctx: FxContext): () => Template;
  styles?: CSSResult|CSSResult[];
}

interface NormalizedFxOptions extends Required<FxOptions> {
  tag: string;
  props: NormalizedProps;
  attrs: Record<string, string>;
  styles: CSSResult[];
}

class FxContext {
  readonly el: FxElement;
  readonly sync: string;
  readonly attrs: Record<string, string>;
  readonly props: NormalizedProps;

  /**
   * Instansiates a new setup context for a FxElement
   * @param {FxElement} el Element to relate context to
   * @param {NormalizedFxOptions} options Normalized element options
   */
  constructor(el: FxElement, options: NormalizedFxOptions) {
    this.el = el;
    this.sync = options.sync;
    this.attrs = options.attrs;
    this.props = options.props;
  }

  /**
   * Dispatches an event from the host element
   * @param {string} eventName Event to emit
   * @param {*} detail Custom event value
   * @returns {void}
   */
  emit(eventName: string, detail?: any, options?: EventInit): void {
    let e = typeof detail != 'undefined'
      ? new CustomEvent(eventName, { detail, ...options })
      : new Event(eventName, options);

    this.el.dispatchEvent(e);
  }
}

class FxInstance {
  readonly el: FxElement;
  readonly options: NormalizedFxOptions;
  readonly ctx: FxContext;
  readonly hooks: Record<string, Set<Function>>;
  readonly fx: Fx;
  readonly props: PropsData;
  readonly shadowRoot: ShadowRoot;
  private renderTemplate: () => Template;
  private rendering: boolean = false;
  private shimAdoptedStyleSheets: boolean = false;
  firstMount: boolean = true;

  get mounted(): boolean {
    return this.el?.parentNode != null;
  }

  /**
   * Constructs a new element instance, holds all the functionality to avoid polluting element
   * @param {FxElement} el Element to create instance from
   * @param {NormalizedFxOptions} options Normalized element options
   */
  constructor(el: FxElement, options: NormalizedFxOptions) {
    activeInstance = this;
    elementInstances.set(el, this);

    this.el = el;
    this.options = options;
    this.ctx = new FxContext(el, options);
    this.hooks = {};
    this.fx = new Fx(this.update.bind(this), {
      lazy: true,
      computed: false,
      scheduler: this.scheduleUpdate.bind(this),
    });
    this.props = propDefaults(options.props);
    this.shadowRoot = el.attachShadow({ mode: options.closed ? 'closed' : 'open' });
    this.setup();
  }

  /**
   * Runs the setup function to collect dependencies and hold logic
   * @returns {void}
   */
  setup(): void {
    const { props, ctx, options } = this;
    const { name, setup, tag, styles } = options;

    // Create a custom proxy for the props
    const proxy = new Proxy(props, {
      get(_, key: string) {
        Fx.track(props, key);
        return props[key];
      },
      set(_, key: string, value: unknown) {
        ctx.emit(`fxsync::${key}`, value, { bubbles: false });
        return true;
      },
      deleteProperty() {
        exception('Props are not deletable', name);
      },
    });

    // Run setup function to gather reactive data
    // Pause tracking while calling setup function
    Fx.pauseTracking();
    this.renderTemplate = setup.call(null, proxy, ctx);
    Fx.resetTracking();
    activeInstance = null;

    if (!isFunction(this.renderTemplate)) {
      exception('Setup must return a function that returns a TemplateResult', `${name}#setup`);
    }

    // Shim styles for shadow root, if needed
    if (window.ShadowRoot && this.shadowRoot instanceof window.ShadowRoot) {
      this.shimAdoptedStyleSheets = shimAdoptedStyleSheets(this.shadowRoot, tag, styles);
    }
  }


  /**
   * Runs all the specified hooks on the Fx instance
   * @param {string} hook Specified hook name
   * @returns {void}
   */
  runHooks(hook: string): void {
    const hooks = this.hooks[hook];

    if (hooks?.size) {
      hooks.forEach(hook => {
        Fx.pauseTracking();
        hook.call(null);
        Fx.resetTracking();
      });
    }
  }


  /**
   * Schedules a run to render updated content
   * @param {Function} run Runner function
   * @returns {void}
   */
  scheduleUpdate(run: () => void): void {
    // Prevent overlapping renders
    if (this.rendering) return;
    this.rendering = true;

    // Enqueue the render
    Queue.push(() => {
      if (!this.mounted) {
        this.runHooks(HookTypes.BEFORE_MOUNT);
        run();
      } else {
        this.runHooks(HookTypes.BEFORE_UPDATE);
        run();
        this.runHooks(HookTypes.UPDATE);
      }

      this.rendering = false;
    });
  }


  /**
   * Renders shadow root content
   * @returns {void}
   */
  update(): void {
    const { shadowRoot, options } = this;
    const template = this.renderTemplate();

    if (!(template instanceof Template)) {
      exception('Setup must return a function that returns a TemplateResult', `${options.name}#setup`);
    }

    render(template, shadowRoot);

    if (this.shimAdoptedStyleSheets) {
      options.styles.forEach(style => shadowRoot.appendChild(style.createElement()));
      this.shimAdoptedStyleSheets = false;
    }
  }
}

// HTMLElement needs es6 classes to instansiate properly
export class FxElement extends HTMLElement {
  static get is(): string { return ''; }

  /**
   * Constructs a new FxElement
   * @param {NormalizedFxOptions} options Normalized element options
   */
  constructor(options: NormalizedFxOptions) {
    super();
    const instance = new FxInstance(this, options);

    // Set props on the element
    const { props, name } = instance.options;
    const propsData = instance.props;

    // Set props as getters/setters on element
    // props should be a readonly reactive object
    for (let key of Object.keys(props)) {
      // If prop already exists, then we throw error
      if (this.hasOwnProperty(key)) {
        exception(`Prop ${key} is reserved, please use another.`, name);
      }

      // Validate props default value
      validateProp(props, key, propsData[key]);

      Object.defineProperty(this, key, {
        get: () => propsData[key],
        set: (newValue) => {
          if (newValue !== propsData[key]) {
            // Trigger an update on the element
            propsData[key] = toReactive(validateProp(props, key, newValue));
            Fx.trigger(propsData, TriggerOpTypes.SET, key);
          }
        },
      });
    }

    // Queue the render
    instance.fx.scheduleRun();
  }

  /**
   * Runs when mounted to the DOM
   * @returns {void}
   */
  connectedCallback() {
    const instance = elementInstances.get(this);
    instance.runHooks(HookTypes.BEFORE_MOUNT);

    // Only run on subsequent connections due to being
    //  called by shady-render on first run.
    if (!instance.firstMount) {
      window.ShadyCSS?.styleElement(this);
    }

    instance.runHooks(HookTypes.MOUNT);
    instance.firstMount = false;
  }

  /**
   * Runs when unmounted from DOM
   * @returns {void}
   */
  disconnectedCallback() {
    const instance = elementInstances.get(this);
    instance.runHooks(HookTypes.BEFORE_UNMOUNT);
    Queue.push(() => instance.runHooks(HookTypes.UNMOUNT));
  }

  /**
   * Observes attribute changes, triggers updates on props
   * @returns {void}
   */
  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    // newValue & oldValue null if not set, string if set, default to empty string
    if (oldValue !== newValue) {
      const instance = elementInstances.get(this);
      const { attrs } = instance.options;
      const key = attrs[attr];

      this[key] = newValue;
    }
  }
}

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
function normalizeOptions<T>(options: FxOptions<T>): NormalizedFxOptions {
  const { setup, sync, styles } = options;
  const props = options.props ?? {};
  let css: CSSResult[] = [];

  if (styles) {
    if (Array.isArray(styles)) {
      css = [ ...collectStyles(styles) ];
    } else {
      css.push(styles);
    }
  }

  return {
    name: options.name,
    tag: camelToKebab(options.name),
    closed: options.closed ?? false,
    props: options.props ? normalizeProps(props) : props,
    attrs: mapObject((key) => [ camelToKebab(key), key ], props),
    sync: sync ?? 'value',
    setup: setup ?? null,
    styles: css,
  } as NormalizedFxOptions;
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
