import { effect, pauseTracking, resetTracking, shallowReadonly, shallowReactive } from '@vue/reactivity';
import { hyphenate } from '@vue/shared';
import { isFunction, isPromise } from '@kirei/shared';
import { exception, warn, KireiError } from '../logging';
import { HookTypes } from '../api/lifecycle';
import * as Queue from './queue';
import { CSSResult } from './css';
import { render } from './compiler';
import { propDefaults } from './props';

import type { ReactiveEffect } from '@vue/reactivity';
import type { Directive } from './compiler';
import type { InjectionKey } from '../api/inject';
import type {
  IComponent,
  IComponentInstance,
  NormalizedComponentOptions,
  NormalizedProps,
  PropsData,
  SetupResult,
  SetupContext
} from '../types';
import { applications } from '../api/app';

const instanceStack: ComponentInstance[] = [];
const instances = new WeakMap<Element, ComponentInstance>();

export function getCurrentInstance(): ComponentInstance|null {
  return instanceStack.length ? instanceStack[instanceStack.length - 1] : null;
}

export function setCurrentInstance(instance: ComponentInstance | null): void {
  if (instance == null) {
    instanceStack.pop();
  } else {
    instanceStack.push(instance);
  }
}

/**
 * Instance to sandbox functionality of a Component
 * @private
 */
export class ComponentInstance implements IComponentInstance {
  private shimAdoptedStyleSheets = false;
  private hooks: Map<string, Set<Function>>;
  readonly effect: ReactiveEffect;
  readonly root: IComponentInstance;
  readonly el: IComponent;
  readonly parent?: IComponentInstance;
  options: NormalizedComponentOptions;
  template: Promise<SetupResult>|SetupResult;
  shadowRoot: ShadowRoot;
  props: PropsData;
  provides: Record<string | symbol, unknown>;
  directives?: Record<string, Directive>;
  emitted?: Record<string, boolean>;
  events: Record<string, Function>;

  /**
   * Checks if the component instance is currently mounted
   * @returns True if element is mounted
   */
  mounted: boolean = false;

  /**
   * Gets an instance from its element
   * @param el - Component to get instance for
   * @returns The requested instance, or null if not found
   */
  static get(el: Element): ComponentInstance|null {
    return instances.get(el);
  }

  /**
   * Constructs a new element instance, holds all the functionality to avoid polluting element
   * @param el - Component to create instance from
   * @param opts - Normalized element options
   */
  constructor(el: IComponent, opts: NormalizedComponentOptions) {
    const parent = getCurrentInstance();

    this.options = opts;
    this.el = el;
    this.shimAdoptedStyleSheets = false;
    this.hooks = Object.create(null);

    if (parent) {
      this.parent = parent;
      this.root = parent.root;
      this.provides = parent.provides;
    } else {
      this.parent = null;
      this.root = this;
      this.provides = Object.create(null);
    }

    this.props = shallowReactive(opts.props ? propDefaults(opts.props) : {});
    this.effect = effect(this.update.bind(this), {
      lazy: true,
      scheduler: Queue.push,
    });

    // setup function is run on mount to fix the issue with the app mounting
    instances.set(el, this);
  }

  /**
   * Binds event to element
   * @param event - Event to bind
   * @param listener - Function to run when event is fired
   */
  on(event: string, listener: Function): void {
    const events = this.events ?? (this.events = {});

    events[event] = listener;
  }

  /**
   * Binds event to element which is only called once
   * @param event - Event to bind
   * @param listener - Function to run when event is fired
   */
  once(event: string, listener: Function): void {
    const emitted = this.emitted ?? (this.emitted = {});
    if (emitted[event] != null) {
      emitted[event] = false;
    }

    this.on(event, listener);
  }

  /**
   * Unbind event(s) from the element
   * @param event - Event to unbind
   * @param listener - Specific listener to unbind
   */
  off(event: string, listener?: Function): void {
    const res = this.events[event];

    if (res && (listener == null || res === listener)) {
      this.events[event] = null;
    }
  }

  /**
   * Dispatches an event to parent instance
   * @param eventName - Event to emit
   * @param detail - Custom event value
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
   */
  setup(): void {
    const { options, el, parent } = this;
    const { setup, directives, hooks, emits } = options;

    this.directives = Object.create(null);
    this.events = emits ? Object.create(null) : null;
    // Inherit provides from parent or app context
    this.provides = parent ? parent.provides : Object.create(null);

    // TODO: this really needs a refactor
    const app = applications.get(this.root.el.id);
    if (app) {
      if (this.root == this) {
        app.container = this;
        this.provides = Object.create(app.context.provides);
      }

      this.directives = Object.create(app.context.directives);
    }

    // Inject global hooks to instance
    if (hooks) {
      Object.keys(hooks).forEach(key => {
        this.hooks[key] = new Set(hooks[key]);
      });
    }

    if (directives) {
      Object.keys(directives).forEach(key => {
        this.directives[key] = directives[key];
      });
    }

    try {
      setCurrentInstance(this);

      let props: Readonly<Record<string, unknown>>;
      let ctx: SetupContext;

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
        props = __DEV__ ? shallowReadonly(this.props) : shallowReactive(this.props);
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
    } catch (ex) {
      if (ex instanceof KireiError) {
        throw ex;
      }

      exception(ex, 'setup()');
    } finally {
      resetTracking();
      setCurrentInstance(null);
    }
  }

  /**
   * Provides a value for the instance
   * @param key - Key of provider
   * @param value - Provider value
   */
  provide<T>(key: InjectionKey<T>|string, value: T): void {
    const { parent } = this;
    if (parent?.provides === this.provides) {
      this.provides = Object.create(parent.provides);
    }

    this.provides[key as string] = value;
  }

  /**
   * Reflows styles with shady shims or adopted stylesheets
   * @param mount - True If mounting or false if updating
   */
  async reflowStyles(mount?: boolean): Promise<void> {
    const { ShadyCSS, ShadowRoot } = window;
    const { tag, styles } = this.options;

    if (styles?.length) {
      // stylesubtree on updates, as per ShadyCSS documentation
      if (mount) {
        ShadyCSS?.styleElement(this.el);
      } else {
        ShadyCSS?.styleSubtree(this.el);
      }

      if (ShadowRoot && this.shadowRoot instanceof ShadowRoot) {
        const res = await CSSResult.adoptStyleSheets(this.shadowRoot, tag, styles);
        this.shimAdoptedStyleSheets = !res;
      }
    }
  }

  /**
   * Create shadow root and shim styles
   */
  mount(): void {
    // Collect props from attributes and props
    // if the setup function returns a promise, wait for it before mounting.
    this.setup();

    // Only run shady shims on first mount
    const { closed } = this.options;
    if (!this.shadowRoot) {
      this.shadowRoot = this.el.attachShadow({ mode: closed ? 'closed' : 'open' });
      this.reflowStyles(true);
    }

    this.effect();
    this.mounted = true;
  }

  /**
   * Call unmounting lifecycle hooks
   */
  unmount(): void {
    this.runHooks(HookTypes.BEFORE_UNMOUNT);
    this.mounted = false;
    Queue.push(() => this.runHooks(HookTypes.UNMOUNTED));
  }

  /**
   * Runs all the specified hooks on the Fx instance
   * @param hook - Specified hook name
   * @param args - Arguments to pass to every hook
   * TODO: Ditch args for config to do something on every run (for errorCaptured)
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
   * @param name - Specified hook name
   * @param hook - Hook function to attach to the lifecycle
   */
  injectHook(name: string, hook: Function): void {
    const { hooks } = this;
    hooks[name] = hooks[name] ?? new Set();
    hooks[name].add(hook);
  }

  /**
   * Renders shadow root content
   */
  update(): void {
    const { shadowRoot, options, template, mounted } = this;
    if (template == null || isPromise(template)) {
      // Only update template if it is set or not a promise
      // If a promise then it will be resolved in the future
      return;
    }

    this.runHooks(mounted ? HookTypes.BEFORE_UPDATE : HookTypes.BEFORE_MOUNT);

    try {
      setCurrentInstance(this);
      render(template(), shadowRoot, { scopeName: options.tag });
    } catch (ex) {
      exception(ex);
    } finally {
      setCurrentInstance(null);
    }

    // Adopted stylesheets not supported, shim with style element
    if (this.shimAdoptedStyleSheets) {
      const style = document.createElement('style');
      style.textContent = options.styles.join('\n');

      shadowRoot.insertBefore(style, shadowRoot.firstChild);
      this.shimAdoptedStyleSheets = false;
    }

    // Run update hook
    this.runHooks(mounted ? HookTypes.UPDATED : HookTypes.MOUNTED);
  }
}
