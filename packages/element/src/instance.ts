import { Template } from '@shlim/html';
import { Fx, TriggerOpTypes, toReactive } from '@shlim/fx';
import { isFunction, mapObject, camelToKebab, warn, exception } from '@shlim/shared';
import { HookTypes } from './api/lifecycle';
import * as Queue from './queue';
import { CSSResult, shimAdoptedStyleSheets } from './css';
import { render, DirectiveFactory } from './compiler';
import {
  Props,
  PropsData,
  ResolvePropTypes,
  NormalizedProps,
  validateProp,
  normalizeProps,
  propDefaults,
} from './props';

const activeInstanceStack: FxInstance[] = [];
export const elementInstances = new WeakMap<FxElement, FxInstance>();

export interface FxOptions<P = Props, T = ResolvePropTypes<P>> {
  name: string;
  closed?: boolean;
  props?: P;
  sync?: string;
  setup(this: void, props: T, ctx: FxContext): () => Template;
  styles?: CSSResult|CSSResult[];
  directives?: Record<string, DirectiveFactory>;
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

export class FxInstance {
  private renderTemplate: () => Template;
  private shimAdoptedStyleSheets = false;

  readonly parent: FxInstance;
  readonly el: FxElement;
  readonly options: NormalizedFxOptions;
  readonly hooks: Record<string, Set<Function>>;
  readonly fx: Fx;
  readonly props: PropsData;
  readonly shadowRoot: ShadowRoot;
  readonly directives?: Record<string, DirectiveFactory>;
  provides: Record<string|symbol, any>;
  firstMount = true;

  static get active(): FxInstance {
    return activeInstanceStack[activeInstanceStack.length - 1];
  }
  static set active(instance: FxInstance) {
    // if instance is falsy, pop the last instance in the stack
    if (instance) {
      activeInstanceStack.push(instance);
    } else {
      activeInstanceStack.pop();
    }
  }

  get mounted(): boolean {
    return this.el?.parentNode != null;
  }

  /**
   * Constructs a new element instance, holds all the functionality to avoid polluting element
   * @param {FxElement} el Element to create instance from
   * @param {NormalizedFxOptions} opts Normalized element options
   */
  constructor(el: FxElement, opts: NormalizedFxOptions) {
    const parent = FxInstance.active;
    // Inherit provides from parent
    if (parent) {
      this.parent = parent;
      this.provides = parent.provides;
    } else {
      this.provides = Object.create(null);
    }

    if (opts.directives) {
      this.directives = opts.directives;
    }

    this.el = el;
    this.options = opts;
    this.hooks = Object.create(null);
    this.props = opts.props ? propDefaults(opts.props) : {};
    this.fx = new Fx(this.update.bind(this), {
      lazy: true,
      scheduler: Queue.push,
    });

    elementInstances.set(el, this);
    this.shadowRoot = el.attachShadow({ mode: opts.closed ? 'closed' : 'open' });
    this.setup();
  }

  /**
   * Runs the setup function to collect dependencies and hold logic
   * @returns {void}
   */
  setup(): void {
    const { props, options } = this;
    const { name, setup, tag, styles } = options;
    const ctx = new FxContext(this.el, options);

    // Create a custom proxy for the props
    const proxy = new Proxy(props, {
      get(_, key: string) {
        Fx.track(props, key);
        return props[key];
      },
      set(_, key: string, value: unknown) {
        if (props.hasOwnProperty(key)) {
          ctx.emit(`fxsync::${key}`, value, { bubbles: false });
          return true;
        }
        return false;
      },
      deleteProperty() {
        exception('Props are not deletable', name);
      },
    });

    // Run setup function to gather reactive data
    // Pause tracking while calling setup function
    FxInstance.active = this;
    Fx.pauseTracking();
    this.renderTemplate = setup.call(null, proxy, ctx);
    Fx.resetTracking();
    FxInstance.active = null

    if (!isFunction(this.renderTemplate)) {
      exception('Setup function must return a TemplateGenerator', `${name}#setup`);
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
  runHooks(hook: string, ...args: any[]): void {
    const hooks = this.hooks[hook];

    if (hooks?.size) {
      Fx.pauseTracking();
      hooks.forEach(hook => hook.apply(null, args));
      Fx.resetTracking();
    }
  }


  /**
   * Schedules a run to render updated content
   * @param {Function} run Runner function
   * @returns {void}
   */
  scheduleUpdate(run: () => void): void {
    if (!this.mounted) {
      this.runHooks(HookTypes.BEFORE_MOUNT);
      run();
    } else {
      this.runHooks(HookTypes.BEFORE_UPDATE);
      run();
      this.runHooks(HookTypes.UPDATE);
    }
  }


  /**
   * Renders shadow root content
   * @returns {void}
   */
  update(): void {
    const { shadowRoot, options, renderTemplate } = this;

    FxInstance.active = this;
    render(renderTemplate(), shadowRoot);
    FxInstance.active = null;

    if (this.shimAdoptedStyleSheets) {
      options.styles.forEach(style => shadowRoot.appendChild(style.element));
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
      const key = instance.options.attrs[attr];
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
function normalizeOptions(options: FxOptions): NormalizedFxOptions {
  let { styles } = options;
  const props = options.props ? normalizeProps(options.props) : {};

  let css: CSSResult[] = null;
  if (styles != null) {
    css = Array.isArray(styles) ? [ ...collectStyles(styles) ] : [ styles ];
  }

  const normalized = options as NormalizedFxOptions;
  normalized.props = props;
  normalized.styles = css;
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
