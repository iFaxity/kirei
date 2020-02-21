import { TemplateResult, RenderOptions, render, templateFactory } from 'lit-html';
import { isFunction, mapObject, camelToKebab } from './shared';
import { Fx } from './fx';
import { templateProcessor } from './processor';
import { reactive, toRefs } from './reactive';
import {
  Props,
  ResolvePropTypes,
  NormalizedProps,
  validateProp,
  normalizeProps,
  propDefaults,
} from './props';

export type LitTemplate = (strings: any, ...values: any[]) => TemplateResult;
export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);
export const svg = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);

export let activeElement = null;
const activeElementStack = [];

export enum HookTypes {
  BEFORE_MOUNT = 'beforeMount',
  MOUNTED = 'mounted',
  BEFORE_UPDATE = 'beforeUpdate',
  UPDATED = 'updated',
  BEFORE_UNMOUNT = 'beforeUnmount',
  UNMOUNTED = 'unmounted',
}

interface FxModel {
  prop?: string;
  event?: string;
}

export interface FxOptions<P = Props, T = Readonly<ResolvePropTypes<P>>> {
  name: string,
  private?: boolean;
  props?: P;
  model?: FxModel;
  setup(this: void, props: T, ctx: FxContext): () => TemplateResult;
  styles?: string;
}

interface FxInstance extends FxOptions {
  props: NormalizedProps,
  hooks: Record<string, Function[]>;
  attrs: Record<string, string>;
}

class FxContext {
  el: FxElement;
  model: FxModel;
  attrs: Record<string, string>;
  props: NormalizedProps;

  constructor(el: FxElement, instance: FxInstance) {
    this.el = el;
    this.model = instance.model;
    this.attrs = instance.attrs;
    this.props = instance.props;
  }

  emit(eventName: string, detail?: any): void {
    let e = typeof detail != 'undefined'
      ? new CustomEvent(eventName, { detail })
      : new Event(eventName);

    this.el.dispatchEvent(e);
  }
}

function parseOptions<T>(options: FxOptions<T>): FxInstance {
  const { setup, model } = options;
  const props = options.props ?? {};

  return {
    props: options.props ? normalizeProps(props) : props,
    attrs: mapObject((key) => [camelToKebab(key), key], props),
    private: options.private ?? false,
    name: camelToKebab(options.name),
    setup: setup ?? null,
    styles: options.styles ?? null,
    hooks: mapObject((_, value) => [ value, [] ], HookTypes),
    model: {
      prop: model?.prop ?? 'value',
      event: model?.event ?? 'input',
    }
  } as FxInstance;
}

/**
 * Defines a new custom element
 */
export function defineElement<T extends Readonly<Props>>(options: FxOptions<T>): typeof FxElement {
  const instance = parseOptions(options);
  const attrs = Object.keys(instance.attrs);

  if (!instance.name.includes('-')) {
    console.warn('Fx: Component names should include a hyphen (-) or be camelised with at least 2 uppser case characters.');
  }

  const CustomElement = class extends FxElement {
    static get is() {
      return instance.name;
    }

    static get observedAttributes() {
      return attrs;
    }

    constructor() {
      super(instance);
    }
  };

  window.customElements.define(instance.name, CustomElement);
  return CustomElement;
}

// HTMLElement needs es6 classes to instansiate properly
export class FxElement extends HTMLElement {
  readonly _ctx: FxContext;
  readonly _styles?: string = null;
  readonly _hooks: Record<string, Function[]>;
  readonly _renderOptions: RenderOptions;
  readonly _fx: Fx;
  readonly _private: boolean;

  private _renderTemplate: () => TemplateResult;
  private _updating: boolean = false;
  private _mounted: boolean = false;
  private _renderRoot: ShadowRoot;

  constructor(instance: FxInstance) {
    super();
    const { setup } = instance;

    this._ctx = new FxContext(this, instance);
    this._private = instance.private;
    this._styles = instance.styles;
    this._hooks = instance.hooks;
    this._renderOptions = {
      //scopeName: this.tagName.toLowerCase(),
      templateFactory,
      eventContext: this,
    };
    this._fx = new Fx(this._render.bind(this), {
      lazy: true,
      computed: false,
      scheduler: this._scheduleRender.bind(this),
    });

    const propsData = reactive(propDefaults(instance.props));

    // Set props as getters/setters on element
    // props should be a readonly reactive object
    for (let key of Object.keys(propsData)) {
      // If prop already exists, then we throw error
      if (this.hasOwnProperty(key)) {
        throw new Error(`Prop ${key} is reserved, please use another.`);
      }

      // Validate props default value
      validateProp(instance.props, key, propsData[key]);

      Object.defineProperty(this, key, {
        get: () => propsData[key],
        set: (newValue) => {
          propsData[key] = validateProp(instance.props, key, newValue);
        },
      });
    }

    // Run setup function and gather reactive data
    activeElement = this;
    activeElementStack.push(this);
    const renderTemplate = setup.call(undefined, toRefs(propsData), this._ctx);

    if (!isFunction(renderTemplate)) {
      throw new TypeError('Setup functions must return a function which return a template literal');
    }

    activeElement = activeElementStack[activeElementStack.length - 1] ?? null;
    this._renderTemplate = renderTemplate;
  }

  /**
   * Runs when mounted to the dom
   */
  connectedCallback() {
    // Render element
    const mode = this._private ? 'closed' : 'open';
    this._renderRoot = this.attachShadow({ mode });
    this._fx.scheduleRun();
  }

  /**
   * Runs when unmounted from dom
   */
  disconnectedCallback() {
    this._callHooks(HookTypes.BEFORE_UNMOUNT);
    this._callHooks(HookTypes.UNMOUNTED);
  }

  /**
   * Observed attribute changed
   */
  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    // newValue & oldValue null if not set, string if set, default to empty string
    const key = this._ctx.attrs[attr];
    const { type } = this._ctx.props[key];

    if (oldValue !== newValue) {
      let value: unknown = newValue;

      // Different parsing based on first (or only) type
      if (type[0] === Boolean) {
        // If primary type boolean, null is false, '' is true
        if (newValue == null || newValue == 'false') {
          value = false;
        } else if (newValue === '' || newValue == 'true') {
          value = true;
        }
      } else if (type[0] === Number) {
        // If number as first type, try parse value as number
        // Implicit better than parseFloat, ensures whole string is number
        let n = +value;
        if (!isNaN(n)) {
          value = n;
        }
      }

      this[key] = value;
    }
  }

  /**
   * Calls the hooks on the Fx instance
   */
  _callHooks(hook: string) {
    const hooks = this._hooks[hook];

    if (hooks) {
      hooks.forEach(fn => isFunction(fn) && fn());
    }
  }


  /**
   * Schedules a run to render updated content
   */
  _scheduleRender(run: () => void) {
    if (this._updating) return;

    const mounted = this._mounted;
    this._updating = true;

    requestAnimationFrame(() => {
      this._callHooks(mounted ? HookTypes.BEFORE_UPDATE : HookTypes.BEFORE_MOUNT);
      run.call(this._fx);

      this._updating = false;
      this._mounted = true;
      this._callHooks(mounted ? HookTypes.UPDATED : HookTypes.MOUNTED);
    });
  }


  /**
   * Renders shadow root content
   */
  _render() {
    let result = this._renderTemplate();

    if (!(result instanceof TemplateResult)) {
      throw new Error('FxElement.render() must return a TemplateResult');
    }

    // If any styles are provided, render it at the start of the html
    if (typeof this._styles == 'string') {
      const css = this._styles;
      result = html`<style>${css}</style>${result}`;
    }

    render(result, this._renderRoot, this._renderOptions);
  }
}
