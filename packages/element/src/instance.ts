import { Template } from '@kirei/html';
import { Fx, TriggerOpTypes, toReactive } from '@kirei/fx';
import { isFunction, exception } from '@kirei/shared';
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
  propDefaults,
} from './props';

const activeInstanceStack: KireiInstance[] = [];
export const instances = new WeakMap<KireiElement, KireiInstance>();

export interface ElementOptions<P = Props, T = ResolvePropTypes<P>> {
  name: string;
  closed?: boolean;
  props?: P;
  sync?: string;
  setup(this: void, props: T, ctx: KireiContext): () => (Template|Node);
  styles?: CSSResult|CSSResult[];
  directives?: Record<string, DirectiveFactory>;
}

export interface NormalizedElementOptions extends Required<ElementOptions> {
  tag: string;
  props: NormalizedProps;
  attrs: Record<string, string>;
  styles: CSSResult[];
}

class KireiContext {
  readonly el: KireiElement;
  readonly sync: string;
  readonly attrs: Record<string, string>;
  readonly props: NormalizedProps;

  /**
   * Instansiates a new setup context for a ElementElement
   * @param {KireiElement} el Element to relate context to
   * @param {NormalizedElementOptions} options Normalized element options
   */
  constructor(el: KireiElement, options: NormalizedElementOptions) {
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

export class KireiInstance {
  private template: () => (Template|Node);
  private shimAdoptedStyleSheets = false;
  private shadowRoot: ShadowRoot;

  readonly parent: KireiInstance;
  readonly el: KireiElement;
  readonly options: NormalizedElementOptions;
  readonly hooks: Record<string, Set<Function>>;
  readonly fx: Fx;
  readonly props: PropsData;
  readonly directives?: Record<string, DirectiveFactory>;
  provides: Record<string|symbol, any>;

  static get active(): KireiInstance {
    return activeInstanceStack[activeInstanceStack.length - 1];
  }
  static set active(instance: KireiInstance) {
    activeInstanceStack.push(instance);
  }
  static resetActive(): void {
    activeInstanceStack.pop();
  }

  get mounted(): boolean {
    return this.el?.parentNode != null;
  }

  /**
   * Constructs a new element instance, holds all the functionality to avoid polluting element
   * @param {KireiElement} el Element to create instance from
   * @param {NormalizedElementOptions} opts Normalized element options
   */
  constructor(el: KireiElement, opts: NormalizedElementOptions) {
    const parent = KireiInstance.active;
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

    this.setup();
    instances.set(el, this);
  }

  /**
   * Runs the setup function to collect dependencies and hold logic
   * @returns {void}
   */
  setup(): void {
    const { props, options } = this;
    const { name, setup } = options;
    let proxy: Record<string, unknown>;
    let ctx: KireiContext;

    // No need for props or ctx if not in the arguments of the setup method
    if (setup.length >= 1) {
      // Create a custom proxy for the props
      proxy = new Proxy(props, {
        get: (_, key: string) => {
          Fx.track(props, key);
          return props[key];
        },
        set: (_, key: string, value: unknown) => {
          const res = props.hasOwnProperty(key);
          if (res) {
            this.el.dispatchEvent(new CustomEvent(`fxsync::${key}`, {
              detail: value,
              bubbles: false,
            }));
          }
          return res;
        },
        deleteProperty: () => {
          exception('Props are not deletable, set it to null or undefined instead!', name);
        },
      });

      // Create context
      if (setup.length >= 2) {
        ctx = new KireiContext(this.el, options);
      }
    }

    // Run setup function to gather reactive data
    // Pause tracking while calling setup function
    KireiInstance.active = this;
    Fx.pauseTracking();
    this.template = setup.call(null, proxy, ctx);
    Fx.resetTracking();
    KireiInstance.resetActive();

    if (!isFunction(this.template)) {
      exception('Setup function must return a TemplateGenerator', `${name}#setup`);
    }
  }

  // Create shadow root and shim styles
  mount() {
    const { tag, styles, closed } = this.options;
    this.runHooks(HookTypes.BEFORE_MOUNT);

    // Only run shims on first mount
    if (!this.shadowRoot) {
      const { ShadyCSS, ShadowRoot } = window;
      ShadyCSS?.styleElement(this.el);
      this.shadowRoot = this.el.attachShadow({ mode: closed ? 'closed' : 'open' });

      if (ShadowRoot && this.shadowRoot instanceof ShadowRoot) {
        this.shimAdoptedStyleSheets = shimAdoptedStyleSheets(this.shadowRoot, tag, styles);
      }
    }

    this.runHooks(HookTypes.MOUNT);
    this.fx.scheduleRun();
  }

  // Call unmounting lifecycle hooks
  unmount() {
    this.runHooks(HookTypes.UNMOUNT);
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
   * Renders shadow root content
   * @returns {void}
   */
  update(): void {
    const { shadowRoot, options, template, mounted } = this;
    this.runHooks(this.mounted ? HookTypes.BEFORE_UPDATE : HookTypes.BEFORE_MOUNT);

    KireiInstance.active = this;
    render(template(), shadowRoot, options.tag);
    KireiInstance.resetActive();

    // Adopted stylesheets not supported, shim with style element
    if (this.shimAdoptedStyleSheets) {
      const style = document.createElement('style');
      for (const css of options.styles) {
        style.textContent += `${css}\n`;
      }

      shadowRoot.insertBefore(style, shadowRoot.firstChild);
      this.shimAdoptedStyleSheets = false;
    }

    // Run update hook
    if (!mounted) {
      this.runHooks(HookTypes.UPDATE);
    }
  }
}

// HTMLElement needs ES6 classes to instansiate properly
export class KireiElement extends HTMLElement {
  static options: NormalizedElementOptions;
  static get is(): string {
    return this.options.tag;
  }
  static get observedAttributes(): string[] {
    // TODO: cache this?
    return Object.keys(this.options.attrs);
  }

  /**
   * Constructs a new KireiElement
   */
  constructor() {
    super();
    const { options } = this.constructor as typeof KireiElement;
    const { props } = new KireiInstance(this, options);

    // Set props on the element
    // Set props as getters/setters on element
    // props should be a readonly reactive object
    for (const key of Object.keys(options.props)) {
      // If prop already exists, then we throw error
      if (this.hasOwnProperty(key)) {
        exception(`Prop ${key} is reserved, please use another.`, options.name);
      }

      // Validate props default value
      validateProp(options.props, key, props[key]);
      Object.defineProperty(this, key, {
        get: () => props[key],
        set: (newValue) => {
          if (newValue !== props[key]) {
            // Trigger an update on the element
            props[key] = toReactive(validateProp(options.props, key, newValue));
            Fx.trigger(props, TriggerOpTypes.SET, key, newValue);
          }
        },
      });
    }
  }

  /**
   * Runs when mounted from DOM
   * @returns {void}
   */
  connectedCallback() {
    const instance = instances.get(this);
    instance.mount();
  }

  /**
   * Runs when unmounted from DOM
   * @returns {void}
   */
  disconnectedCallback() {
    const instance = instances.get(this);
    instance.runHooks(HookTypes.BEFORE_UNMOUNT);
    Queue.push(instance.unmount);
  }

  /**
   * Observes attribute changes, triggers updates on props
   * @returns {void}
   */
  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    // newValue & oldValue null if not set, string if set, default to empty string
    if (oldValue !== newValue) {
      const { options } = this.constructor as typeof KireiElement;
      const key = options.attrs[attr];
      this[key] = newValue;
    }
  }
}
