import { Template } from '@kirei/html';
import { Fx, TriggerOpTypes, toReactive } from '@kirei/fx';
import { isFunction, isUndefined, exception } from '@kirei/shared';
import { HookTypes } from './api/lifecycle';
import * as Queue from './queue';
import { CSSResult } from './css';
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

export interface SyncOptions {
  prop: string;
  event?: string;
}
export interface ElementOptions<P = Props, T = ResolvePropTypes<P>> {
  name: string;
  closed?: boolean;
  props?: P;
  sync?: string|SyncOptions;
  setup(this: void, props: T, ctx: KireiContext): () => (Template|Node);
  styles?: CSSResult|CSSResult[];
  directives?: Record<string, DirectiveFactory>;
}

export interface NormalizedElementOptions extends Required<ElementOptions> {
  tag: string;
  props: NormalizedProps;
  attrs: Record<string, string>;
  styles: CSSResult[];
  sync: SyncOptions;
}

class KireiContext {
  readonly el: KireiElement;
  readonly sync: SyncOptions;
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
    let e = isUndefined(detail)
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
  props: PropsData;
  directives?: Record<string, DirectiveFactory>;
  provides: Record<string|number|symbol, any>;

  static get active(): KireiInstance {
    return activeInstanceStack[activeInstanceStack.length - 1];
  }

  activate(): void {
    activeInstanceStack.push(this);
  }
  deactivate(): void {
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

    this.el = el;
    this.options = opts;
    this.hooks = Object.create(null);
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
    const { options, directives, el } = this;
    const { name, setup } = options;
    let propsProxy: Record<string, unknown>;
    let ctx: KireiContext;

    const props = options.props ? propDefaults(options.props, name) : {};
    this.props = props;
    this.directives = directives;

    // No need for props or ctx if not in the arguments of the setup method
    if (setup.length >= 1) {
      // Create a custom Proxy for the props
      propsProxy = new Proxy(props, {
        get(_, key: string) {
          return Fx.track(props, key), props[key];
        },
        set(_, key: string, value: unknown) {
          const res = props.hasOwnProperty(key);
          if (res) {
            const opts = { detail: value, bubbles: false };
            this.el.dispatchEvent(new CustomEvent(`fxsync::${key}`, opts));
          }
          return res;
        },
        deleteProperty(_, key: string) {
          exception('Props are non-removable, set it to null or undefined instead!', `${name}#${key}`);
        },
      });

      // Create context
      if (setup.length >= 2) {
        ctx = new KireiContext(el, options);
      }
    }

    // Run setup function to gather reactive data
    // Pause tracking while calling setup function
    try {
      this.activate();
      Fx.pauseTracking();
      const template = setup.call(null, propsProxy, ctx);

      if (!isFunction(template)) {
        throw new TypeError('Setup function must return a TemplateGenerator');
      }
      this.template = template;
    } catch (ex) {
      exception(ex.message, name);
    } finally {
      Fx.resetTracking();
      this.deactivate();
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
        this.shimAdoptedStyleSheets = !CSSResult.adoptStyleSheets(this.shadowRoot, tag, styles);
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

    try {
      this.activate();
      render(template(), shadowRoot, options.tag);
    } catch (ex) {
      exception(ex.message, options.tag);
    } finally {
      this.deactivate();
    }

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

      Object.defineProperty(this, key, {
        get: () => props[key],
        set: (newValue) => {
          if (newValue !== props[key]) {
            // Trigger an update on the element
            props[key] = toReactive(validateProp(options.props[key], key, newValue));
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
    Queue.push(() => instance.unmount());
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
