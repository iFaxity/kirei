import { ReactiveEffect, effect, pauseTracking, resetTracking, shallowReadonly, shallowReactive } from '@vue/reactivity';
import { hyphenate } from '@vue/shared';
import { isFunction, isPromise } from '@kirei/shared';
import { exception, warn, KireiError } from './logging';
import { HookTypes } from './api/lifecycle';
import * as Queue from './queue';
import { CSSResult } from './css';
import { render, DirectiveFactory } from './compiler';
import { propDefaults } from './props';
import type { InjectionKey } from './api/inject';
import type {
  IKireiElement,
  IKireiInstance,
  NormalizedElementOptions,
  NormalizedProps,
  PropsData,
  SetupResult
} from './interfaces';

const activeInstanceStack: KireiInstance[] = [];
const instances = new WeakMap<Element, KireiInstance>();

interface IKireiContext {
  readonly el: IKireiElement;
  readonly attrs: Record<string, string>;
  readonly props: NormalizedProps;

  /**
   * Dispatches an event from the host element
   * @param {string} eventName Event to emit
   * @param {*} detail Custom event value
   * @param {EventInit} options Custom event value
   * @returns {void}
   */
  emit(eventName: string, detail?: any|EventInit, options?: EventInit): void;
}

/**
 * Instance to sandbox functionality of a KireiElement
 * @class
 * @private
 */
export class KireiInstance implements IKireiInstance {
  private shimAdoptedStyleSheets = false;
  private hooks: Map<string, Set<Function>>;
  readonly effect: ReactiveEffect;
  readonly el: IKireiElement;
  readonly parent?: IKireiInstance;
  options: NormalizedElementOptions;
  template: Promise<SetupResult>|SetupResult;
  shadowRoot: ShadowRoot;
  props: PropsData;
  provides: Record<string | number | symbol, any>;
  directives?: Record<string, DirectiveFactory>;
  emitted?: Record<string, boolean>;
  events: Record<string, Function>;

  /**
   * Gets an instance from its element
   * @param {Element} el
   * @returns {KireiInstance}
   */
  static get(el: Element): KireiInstance {
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

    this.options = opts;
    this.el = el;
    this.parent = parent;

    // Inherit provides from parent
    this.provides = parent?.provides ?? Object.create(null);
    this.events = opts.emits ? Object.create(null) : null;
    this.props = shallowReactive(opts.props ? propDefaults(opts.props) : {});
    this.effect = effect(this.update.bind(this), {
      lazy: true,
      scheduler: Queue.push,
    });

    // Collect props from attributes and props
    // TODO: find a way to get values from directives before running this
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

  on(event: string, listener: Function): void {
    const events = this.events ?? (this.events = {});

    events[event] = listener;
  }

  once(event: string, listener: Function): void {
    const emitted = this.emitted ?? (this.emitted = {});
    if (emitted[event] != null) {
      emitted[event] = false;
    }

    this.on(event, listener);
  }

  off(event: string, listener?: Function): void {
    const res = this.events[event];

    if (res && (listener == null || res === listener)) {
      this.events[event] = null;
    }
  }

  /**
   * Dispatches an event to parent instance
   * @param {string} eventName Event to emit
   * @param {*} detail Custom event value
   * @returns {void}
   */
  emit(event: string, ...args: any[]): void {
    const handler = this.events[event];
    if (!handler) {
      return;
    }

    if (__DEV__ && !event.startsWith('update:')) {
      const name = hyphenate(event);
      const validator = this.options.emits[name];

      if (isFunction(validator)) {
        if (!validator(...args)) {
          warn(`Component emitted event "${name}" but it is not declared in the emits option.`);
        }
      } else if (validator !== null) {
        // invalid value
        warn(`Invalid event arguments: event validation failed for event "${name}".`);
      }
    }

    // emitted (if once handler will be false or true)
    //   if they have been called or not
    if (this.emitted) {
      const { emitted } = this;

      if (emitted[event] === true) {
        return;
      } else if (emitted[event] === false) {
        emitted[event] = true;
      }
    }

    handler.call(null, ...args);
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

    try {
      this.activate();

      let props: Readonly<Record<string, any>>;
      let ctx: IKireiContext;

      // No need for props or ctx if not in the arguments of the setup method
      if (setup.length >= 1) {
        // Create setup context
        if (setup.length >= 2) {
          let emitter: Function;
          const self = this;

          ctx = {
            get attrs() { return options.attrs; },
            get el() { return el; },
            get props() { return options.props; },
            get emit() {
              return emitter ?? (emitter = self.emit.bind(self));
            },
          };
        }

        // Create a custom Proxy for the props
        // TODO: if production use shallowReactive instead
        props = __DEV__ ? shallowReadonly(this.props) : this.props;
      }

      // Run setup function to gather reactive data
      // Pause tracking while calling setup function
      pauseTracking();

      // Result might be async, expose promise to the outside?
      const res = setup.call(null, props, ctx);
      if (isFunction(res)) {
        this.template = res;
      } else if (res != null) {
        throw new TypeError('Setup function must return a TemplateFactory');
      }

      /*if (isPromise(res)) {
        this.template = res;
        res.then(() => { this.template = res; });
      } else if (isFunction(res)) {
        this.template = res;
      } else if (res != null) {
        throw new TypeError('Setup function must return a TemplateFactory');
      }*/

    } catch (ex) {
      if (ex instanceof KireiError) {
        throw ex;
      }

      exception(ex, 'setup()');
    } finally {
      resetTracking();
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
    this.effect.options.scheduler(this.effect);
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
    const hooks: Set<Function> = this.hooks[hook];
    if (hooks?.size) {
      pauseTracking();
      hooks.forEach(hook => hook.apply(this, args));
      resetTracking();
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
    if (!template || isPromise(template)) {
      // Only update template if it is set or not a promise
      // If a promise then it will be resolved in the future
      return;
    } else if (mounted) {
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
