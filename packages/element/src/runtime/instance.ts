import { effect, pauseTracking, resetTracking, shallowReadonly, shallowReactive } from '@vue/reactivity';
import { hyphenate, isFunction, isPromise } from '@vue/shared';
import { exception, warn } from '../warn';
import { HookTypes } from '../api/lifecycle';
import * as Queue from './queue';
import { adoptStyleSheets } from './css';
import { render } from './compiler';
import { propDefaults } from './props';
import { applications } from '../api/app';

import type { InjectionKey } from '../api/inject';
import type { Directive } from './compiler';
import type {
  IComponent,
  ComponentInstance,
  NormalizedComponentOptions,
  SetupContext,
  SetupResult,
} from '../types';

const instanceStack: ComponentInstance[] = [];
const instances = new WeakMap<Element, ComponentInstance>();

/**
 * Gets the current active component instance, or null if there is no active instance
 * @returns The current active component instance or null if there isn't any
 */
export function getCurrentInstance(): ComponentInstance|null {
  return instanceStack.length ? instanceStack[instanceStack.length - 1] : null;
}

/**
 * Sets the current active instance to the stack, if instance is null the last element is popped
 * @param instance - Component instance to push to the stack
 */
export function setCurrentInstance(instance: ComponentInstance | null): void {
  if (instance == null) {
    instanceStack.pop();
  } else {
    instanceStack.push(instance);
  }
}

/**
* Gets an instance from its element
* @param el - Component to get instance for
* @returns The requested instance, or null if not found
*/
export function getComponentInstance(el: Element): ComponentInstance|null {
  return instances.get(el);
}

/**
 * Creates a component instance to bind to a Kirei Element
 * @param el - element to attach component instance to
 * @param options - component options to configure the instance
 */
export function createComponentInstance(el: IComponent, options: NormalizedComponentOptions): ComponentInstance {
  const { ShadyCSS, ShadowRoot } = window;
  let shimAdoptedStyleSheets = false;
  const parent = getCurrentInstance();
  const instanceEffect = effect(update, { lazy: true, scheduler: Queue.push });

  // props immutable due to how WebComponents load props
  // TODO: create workaround for this
  const props = shallowReactive(options.props ? propDefaults(options.props) : {});

  // mutable
  let mounted = false;
  let suspensible = false;
  let setupResult: Promise<SetupResult> | SetupResult = null;
  let shadowRoot: ShadowRoot = null;
  let provides: Record<string | symbol, unknown> = parent?.provides ?? Object.create(null);
  let directives: Record<string, Directive> = null;
  let emitted: Record<string, boolean> = null;
  let events: Record<string, Function> = null;
  let hooks: Record<string, Set<Function>> = null;

  // Assign used to have root reference itself
  // TODO: writable values should be getters
  const instance: ComponentInstance = Object.create(null);
  instances.set(el, Object.defineProperties(instance, {
    // immutable
    el: { value: el },
    effect: { value: instanceEffect },
    root: { value: (parent?.root ?? instance) },
    parent: { value: parent },
    props: { value: props },

    // internally mutable
    setupResult: { get: () => setupResult },
    shadowRoot: { get: () => shadowRoot },
    provides: { get: () => provides },
    directives: { get: () => directives },
    emitted: { get: () => emitted },
    events: { get: () => events },
    mounted: { get: () => mounted, },
    suspensible: { get: () => suspensible },
    hooks: { get: () => hooks },

    // externally mutable (for hmr-api)
    options: { get: () => options, set: (value) => (options = value) },

    // immutable actions
    on: { value: on },
    once: { value: once },
    off: { value: off },
    emit: { value: emit },
    setup: { value: setup },
    provide: { value: provide },
    reflowStyles: { value: reflowStyles },
    mount: { value: mount },
    unmount: { value: unmount },
    runHooks: { value: runHooks },
    injectHook: { value: injectHook },
    update: { value: update },
  }));

  function on(event: string, listener: Function): void {
    if (!events) {
      events = {};
    }
    events[event] = listener;
  }

  function once(event: string, listener: Function): void {
    if (!emitted) {
      emitted = {};
    }

    if (emitted[event] != null) {
      emitted[event] = false;
    }

    on(event, listener);
  }

  function off(event: string, listener?: Function): void {
    const res = events?.[event];

    if (res && (listener == null || res === listener)) {
      events[event] = null;
    }
  }

  function emit(event: string, ...args: any[]): void {
    const handler = events?.[event];
    if (!handler) {
      return;
    }

    if (__DEV__ && !event.startsWith('update:')) {
      const name = hyphenate(event);
      const validator = options.emits[name];

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
    if (emitted) {
      if (emitted[event] === true) {
        return;
      } else if (emitted[event] === false) {
        emitted[event] = true;
      }
    }

    handler.call(null, ...args);
  }

  function setup(): void {
    directives = Object.create(null);
    hooks = Object.create(null);
    events = options.emits ? Object.create(null) : null;

    // Inherit provides from parent or app context
    provides = parent ? parent.provides : Object.create(null);

    // clear hooks

    // TODO: this really needs a refactor
    const app = applications.get(instance.root.el.id);
    if (app) {
      if (instance.root == instance) {
        app.container = instance;
        provides = Object.create(app.context.provides);
      }

      directives = Object.create(app.context.directives);
    }

    // Inject global hooks to instance
    if (options.hooks) {
      Object.keys(options.hooks).forEach(key => {
        hooks[key] = new Set(options.hooks[key]);
      });
    }

    if (options.directives) {
      Object.keys(options.directives).forEach(key => {
        directives[key] = options.directives[key];
      });
    }

    try {
      const { setup } = options;
      setCurrentInstance(instance);

      let setupProps: Record<string, unknown>;
      let setupContext: SetupContext;

      // No need for props or ctx if not in the arguments of the setup method
      if (setup.length >= 1) {
        // Create setup context
        if (setup.length >= 2) {
          setupContext = {
            get attrs() { return options.attrs; },
            get el() { return el; },
            get emit() { return emit; },
          };
        }

        // Create a custom Proxy for the props
        // TODO: if production use shallowReactive instead
        setupProps = __DEV__ ? shallowReadonly(props) : shallowReactive(props);
      }

      // Run setup function to gather reactive data
      // Pause tracking while calling setup function
      pauseTracking();

      // Result might be async, expose promise to the outside?
      const res = setup.call(null, setupProps, setupContext);
      if (isFunction(res)) {
        setupResult = res;
      } else if (res != null) {
        throw new TypeError('Setup function must return a TemplateFactory');
      }
    } catch (ex) {
      exception(ex, 'setup()');
    } finally {
      resetTracking();
      setCurrentInstance(null);
    }
  }

  function provide<T>(key: InjectionKey<T>|string, value: T): void {
    if (parent?.provides === provides) {
      provides = Object.create(parent.provides);
    }

    provides[key as string] = value;
  }

  async function reflowStyles(mount?: boolean): Promise<void> {
    const { tag, styles } = options;

    if (styles?.length) {
      // styleSubtree on updates, as per ShadyCSS documentation
      if (mount) {
        ShadyCSS?.styleElement(el);
      } else {
        ShadyCSS?.styleSubtree(el);
      }

      if (ShadowRoot && shadowRoot instanceof ShadowRoot) {
        const res = await adoptStyleSheets(shadowRoot, tag, styles);
        shimAdoptedStyleSheets = !res;
      }
    }
  }

  function mount(): void {
    // Collect props from attributes and props
    // if the setup function returns a promise, wait for it before mounting.
    setup();

    // Only run shady shims on first mount
    if (!shadowRoot) {
      shadowRoot = el.attachShadow({ mode: 'open' });
      reflowStyles(true);
    }

    instanceEffect();
    mounted = true;
  }

  function unmount(): void {
    runHooks(HookTypes.BEFORE_UNMOUNT);
    mounted = false;
    Queue.push(() => runHooks(HookTypes.UNMOUNTED));
  }

  function runHooks(hook: string, ...args: any[]): void {
    // TODO: Ditch args for config to do something on every run (for errorCaptured)
    // Errorcaptured is special, should be on another function or have a if statement for it
    const _hooks = hooks[hook];

    if (_hooks?.size) {
      pauseTracking();
      _hooks.forEach(hook => hook.apply(instance, args));
      resetTracking();
    }
  }

  function injectHook(name: string, hook: Function): void {
    if (!hooks[name]) {
      hooks[name] = new Set();
    }
    hooks[name].add(hook);
  }

  function update(): void {
    if (setupResult == null || isPromise(setupResult)) {
      // Only update template if it is set or not a promise
      // If a promise then it could be resolved later by suspense
      return;
    }

    runHooks(mounted ? HookTypes.BEFORE_UPDATE : HookTypes.BEFORE_MOUNT);

    try {
      setCurrentInstance(instance);

      // Only render if setupResult is non-nullable
      const template = setupResult();

      if (template != null) {
        render(template, shadowRoot, { scopeName: options.tag });
      } else if (__DEV__) {
        // TODO: Don't warn if intentional? Somehow add an escape hatch for this
        warn('Nullable returned from setup, this could be intential when using Portal or Suspense', '#update()');
      }
    } catch (ex) {
      exception(ex);
    } finally {
      setCurrentInstance(null);
    }

    // Adopted stylesheets not supported, shim with style element
    if (shimAdoptedStyleSheets) {
      const style = document.createElement('style');
      style.textContent = options.styles.join('\n');

      shadowRoot.insertBefore(style, shadowRoot.firstChild);
      shimAdoptedStyleSheets = false;
    }

    // Run update hook
    runHooks(mounted ? HookTypes.UPDATED : HookTypes.MOUNTED);
  }

  return instance;
}
