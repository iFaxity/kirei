import { Fx } from '@kirei/fx';
import { isFunction, isUndefined } from '@kirei/shared';
import { exception, KireiError } from './logging';
import { HookTypes } from './api/lifecycle';
import * as Queue from './queue';
import { CSSResult } from './css';
import { render, DirectiveFactory } from './compiler';
import { propDefaults } from './props';
import type { Template } from '@kirei/html';
import type { InjectionKey } from './api/inject';
import type { IKireiElement, IKireiInstance, NormalizedElementOptions, SyncOptions, NormalizedProps, PropsData } from './interfaces';

const activeInstanceStack: KireiInstance[] = [];
const instances = new WeakMap<IKireiElement, KireiInstance>();

/**
 * Optional context to have access to higher level APIs in the setup function
 * @class
 * @private
 */
class KireiContext {
  readonly el: IKireiElement;
  readonly sync: SyncOptions;
  readonly attrs: Record<string, string>;
  readonly props: NormalizedProps;

  /**
   * Instansiates a new setup context for a ElementElement
   * @param {KireiElement} el Element to relate context to
   * @param {NormalizedElementOptions} options Normalized element options
   */
  constructor(el: IKireiElement, options: NormalizedElementOptions) {
    this.el = el;
    this.sync = options.sync;
    this.attrs = options.attrs;
    this.props = options.props;
  }

  /**
   * Dispatches an event from the host element
   * @param {string} eventName Event to emit
   * @param {*} detail Custom event value
   * @param {EventInit} options Custom event value
   * @returns {void}
   */
  emit(eventName: string, detail: any, options: EventInit = {}) {
    let e = isUndefined(detail)
      ? new CustomEvent(eventName, { detail, ...options })
      : new Event(eventName, options);
    this.el.dispatchEvent(e);
  }
}


/**
 * Instance to sandbox functionality of a KireiElement
 * @class
 * @private
 */
export class KireiInstance implements IKireiInstance {
  private template: () => Template;
  private shimAdoptedStyleSheets: boolean = false;
  private hooks: Map<string, Set<Function>>;
  readonly fx: Fx;
  readonly parent?: KireiInstance;
  readonly el: IKireiElement;
  shadowRoot: ShadowRoot;
  options: NormalizedElementOptions;
  props: PropsData;
  directives?: Record<string, DirectiveFactory>;
  provides: Record<string | number | symbol, any>;

  /**
   * Gets an instance from its element
   * @param {IKireiElement} el
   * @returns {KireiInstance}
   */
  static get(el: IKireiElement): KireiInstance {
    return instances.get(el);
  }

  /**
   * Gets the active instance
   * @returns {KireiInstance}
   */
  static get active(): KireiInstance {
    return activeInstanceStack[activeInstanceStack.length - 1];
  }

  /**
   * Constructs a new element instance, holds all the functionality to avoid polluting element
   * @param {IKireiElement} el Element to create instance from
   * @param {NormalizedElementOptions} opts Normalized element options
   */
  constructor(el: IKireiElement, opts: NormalizedElementOptions) {
    this.shimAdoptedStyleSheets = false;
    const parent = KireiInstance.active;
    // Inherit provides from parent
    this.parent = parent;
    this.provides = parent?.provides ?? Object.create(null);
    this.el = el;
    this.options = opts;
    this.fx = new Fx(this.update.bind(this), {
      lazy: true,
      scheduler: Queue.push,
    });
    this.props = opts.props ? propDefaults(opts.props) : {};
    this.setup();
    instances.set(el, this);
  }

  /**
   * Checks if the element instance is currently mounted
   * @returns {boolean}
   */
  get mounted(): boolean {
    return !!this.el?.parentNode;
  }

  /**
   * Runs the setup function to collect dependencies and run logic
   * @returns {void}
   */
  setup(): void {
    const { options, directives, el } = this;
    const { setup } = options;
    this.hooks = Object.create(null);
    this.directives = directives;

    // Inject global hooks to instance
    if (options.hooks) {
      for (const key of Object.keys(options.hooks)) {
        this.hooks[key] = new Set(options.hooks[key]);
      }
    }

    let propsProxy;
    let ctx;
    try {
      this.activate();

      // No need for props or ctx if not in the arguments of the setup method
      if (setup.length >= 1) {
        const { props } = this;
        // Create a custom Proxy for the props
        propsProxy = new Proxy(props, {
          get(_, key: string) {
            return Fx.track(props, key), props[key];
          },
          set(_, key: string, value: any) {
            const res = props.hasOwnProperty(key);
            if (res) {
              const opts = { detail: value, bubbles: false };
              el.dispatchEvent(new CustomEvent(`fxsync::${key}`, opts));
            }
            return res;
          },
          deleteProperty(_, key: string) {
            exception('Props are non-removable, set it to null or undefined instead!', `props.${key}`);
          },
        });

        // Create context
        if (setup.length >= 2) {
          ctx = new KireiContext(el, options);
        }
      }
    } catch (ex) {
      this.deactivate();
      if (ex instanceof KireiError) {
        throw ex;
      }

      exception(ex);
    }

    // Run setup function to gather reactive data
    // Pause tracking while calling setup function
    try {
      Fx.pauseTracking();
      const template = setup.call(null, propsProxy, ctx);
      if (!isFunction(template)) {
        throw new TypeError('Setup function must return a TemplateFactory');
      }
      this.template = template;
    } catch (ex) {
      if (ex instanceof KireiError) {
        throw ex;
      }

      exception(ex, 'setup()');
    } finally {
      Fx.resetTracking();
      this.deactivate();
    }
  }

  /**
   * Provides a value for the instance
   * @param {InjectionKey<T>|string}
   * @param {T} value
   * @returns {void}
   */
  provide<T>(key: InjectionKey<T>|string, value: T): void {
    const { parent } = this;
    if (parent?.provides === this.provides) {
      this.provides = Object.create(parent.provides);
    }

    this.provides[key as string] = value;
  }

  /**
   * Pushes this instance to the front of the active stack
   * @returns {void}
   */
  activate(): void {
    if (KireiInstance.active !== this) {
      activeInstanceStack.push(this);
    }
  }

  /**
   * Removes this instance from the front of the active stack
   * Will be no-op of the instance is not at the front
   * @returns {void}
   */
  deactivate(): void {
    if (KireiInstance.active === this) {
      activeInstanceStack.pop();
    }
  }

  /**
   * Reflows styles
   * @param {boolean} mount
   * @returns {void}
   */
  reflowStyles(mount?: boolean): void {
    const { ShadyCSS, ShadowRoot } = window;
    const { tag, styles } = this.options;

    // stylesubtree on updates, as per ShadyCSS documentation
    if (mount) {
      ShadyCSS?.styleElement(this.el);
    } else {
      ShadyCSS?.styleSubtree(this.el);
    }

    if (ShadowRoot && this.shadowRoot instanceof ShadowRoot) {
      this.shimAdoptedStyleSheets = !CSSResult.adoptStyleSheets(this.shadowRoot, tag, styles);
    }
  }

  /**
   * Create shadow root and shim styles
   * @returns {void}
   */
  mount(): void {
    const { closed } = this.options;
    this.runHooks(HookTypes.BEFORE_MOUNT);

    // Only run shims on first mount
    if (!this.shadowRoot) {
      this.shadowRoot = this.el.attachShadow({ mode: closed ? 'closed' : 'open' });
      this.reflowStyles(true);
    }

    this.runHooks(HookTypes.MOUNT);
    this.fx.scheduleRun();
  }

  /**
   * Call unmounting lifecycle hooks
   * @returns {void}
   */
  unmount(): void {
    this.runHooks(HookTypes.BEFORE_UNMOUNT);
    Queue.push(() => this.runHooks(HookTypes.UNMOUNT));
  }

  /**
   * Runs all the specified hooks on the Fx instance
   * @param {string} hook Specified hook name
   * @param {...any[]} args Arguments to pass to every hook
   * @returns {void}
   */
  runHooks(hook: string, ...args: any[]): void {
    const hooks = this.hooks[hook];
    if (hooks === null || hooks === void 0 ? void 0 : hooks.size) {
      Fx.pauseTracking();
      hooks.forEach(hook => hook.apply(this, args));
      Fx.resetTracking();
    }
  }

  /**
   * Adds a lifecycle hook to instance
   * @param {string} name Specified hook name
   * @param {Function} hook Hook function to attach to the lifecycle
   * @returns {void}
   */
  injectHook(name: string, hook: Function): void {
    const { hooks } = this;
    hooks[name] = hooks[name] ?? new Set();
    hooks[name].add(hook);
  }

  /**
   * Renders shadow root content
   * @returns {void}
   */
  update(): void {
    const { shadowRoot, options, template, mounted } = this;
    if (mounted) {
      this.runHooks(HookTypes.BEFORE_UPDATE);
    }

    try {
      this.activate();
      render(template(), shadowRoot, options.tag);
    } catch (ex) {
      exception(ex);
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
    if (mounted) {
      this.runHooks(HookTypes.UPDATE);
    }
  }
}
