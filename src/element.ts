import { TemplateResult, RenderOptions, render, templateFactory } from 'lit-html';
import { isFunction, mapObject, camelToKebab, HookTypes } from './shared';
import { Fx } from './fx';
import { reactive, toRefs } from './reactive';
import * as Queue from './queue';
import { templateProcessor } from './processor';
import {
  Props,
  PropsData,
  ResolvePropTypes,
  NormalizedProps,
  validateProp,
  normalizeProps,
  propDefaults,
} from './props';

export const html = (strings, ...values) => new TemplateResult(strings, values, 'html', templateProcessor);
export const svg = (strings, ...values) => new TemplateResult(strings, values, 'svg', templateProcessor);
export let activeElement: FxElement = null;
const activeElementStack: FxElement[] = [];
export const elementInstances = new WeakMap<FxElement, FxInstance>();

interface FxModel {
  prop?: string;
  event?: string;
}

export interface FxOptions<P = Props, T = Readonly<ResolvePropTypes<P>>> {
  name: string;
  closed?: boolean;
  props?: P;
  model?: FxModel;
  setup(this: void, props: T, ctx: FxContext): () => TemplateResult;
  styles?: string;
}

interface NormalizedFxOptions extends FxOptions {
  props: NormalizedProps;
  attrs: Record<string, string>;
}

class FxContext {
  el: FxElement;
  model: FxModel;
  attrs: Record<string, string>;
  props: NormalizedProps;

  constructor(el: FxElement, instance: NormalizedFxOptions) {
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

class FxInstance {
  readonly options: NormalizedFxOptions;
  readonly ctx: FxContext;
  readonly hooks: Record<string, Function[]>;
  readonly renderOptions: RenderOptions;
  readonly fx: Fx;
  readonly props: PropsData;
  readonly shadowRoot: ShadowRoot;
  readonly renderTemplate: () => TemplateResult;
  rendering: boolean = false;
  mounted: boolean = false;

  constructor(el: FxElement, options: NormalizedFxOptions) {
    this.options = options;
    this.ctx = new FxContext(el, options);
    this.hooks = mapObject((_, value) => [ value, [] ], HookTypes);
    this.renderOptions = {
      //scopeName: this.localName,
      templateFactory,
      eventContext: el,
    };
    this.fx = new Fx(this.render.bind(this), {
      lazy: true,
      computed: false,
      scheduler: this.scheduleRender.bind(this),
    });

    this.props = reactive(propDefaults(options.props));
    this.shadowRoot = el.attachShadow({ mode: options.closed ? 'closed' : 'open' });

    // Run setup function to gather reactive data
    this.renderTemplate = options.setup.call(undefined, toRefs(this.props), this.ctx);

    if (!isFunction(this.renderTemplate)) {
      throw new TypeError('Setup functions must return a function which return a TemplateResult');
    }
  }


  /**
   * Runs all the specified hooks on the Fx instance
   */
  runHooks(hook: string): void {
    const hooks = this.hooks[hook];

    if (hooks?.length) {
      hooks.forEach(fn => isFunction(fn) && fn.call(undefined));
    }
  }


  /**
   * Schedules a run to render updated content
   */
  scheduleRender(run: () => void): void {
    // Prevent overlapping renders
    if (this.rendering) return;
    this.rendering = true;

    // Queue the render
    Queue.push(() => {
      this.mounted && this.runHooks(HookTypes.BEFORE_UPDATE);
      run.call(this.fx);
      this.mounted && this.runHooks(HookTypes.UPDATE);

      this.rendering = false;
      this.mounted = true;
    });
  }


  /**
   * Renders shadow root content
   */
  render(): void {
    const { shadowRoot, mounted, options } = this;
    const result = this.renderTemplate();

    if (!(result instanceof TemplateResult)) {
      throw new Error('FxElement.render() must return a TemplateResult');
    }

    render(result, shadowRoot, this.renderOptions);

    if (!mounted && typeof options.styles == 'string') {
      const $style = document.createElement('style');
      $style.textContent = options.styles;
      shadowRoot.insertBefore($style, shadowRoot.firstChild);
    }
  }
}

// HTMLElement needs es6 classes to instansiate properly
export class FxElement extends HTMLElement {
  constructor(options: NormalizedFxOptions) {
    super();
    activeElement = this;
    activeElementStack.push(this);

    const instance = new FxInstance(this, options);
    elementInstances.set(this, instance);
    activeElement = activeElementStack[activeElementStack.length - 1] ?? null;

    // Set props on the element
    const { props } = instance.options;
    const propsData = instance.props;

    // Set props as getters/setters on element
    // props should be a readonly reactive object
    for (let key of Object.keys(props)) {
      // If prop already exists, then we throw error
      if (this.hasOwnProperty(key)) {
        throw new TypeError(`Prop ${key} is reserved, please use another.`);
      }

      // Validate props default value
      validateProp(props, key, propsData[key]);

      Object.defineProperty(this, key, {
        get: () => propsData[key],
        set: (newValue) => {
          propsData[key] = validateProp(props, key, newValue);
        },
      });
    }

    // Queue the render
    instance.fx.scheduleRun();
  }

  /**
   * Runs when mounted to the dom
   */
  connectedCallback() {
    const instance = elementInstances.get(this);
    instance.runHooks(HookTypes.BEFORE_MOUNT);
    instance.runHooks(HookTypes.MOUNT);
  }

  /**
   * Runs when unmounted from dom
   */
  disconnectedCallback() {
    const instance = elementInstances.get(this);
    instance.runHooks(HookTypes.BEFORE_UNMOUNT);
    instance.runHooks(HookTypes.UNMOUNT);
  }

  /**
   * Observes attribute changes
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
 * Normalizes the options object
 * @param {object} options
 * @returns {object}
 */
function normalizeOptions<T>(options: FxOptions<T>): NormalizedFxOptions {
  const { setup, model } = options;
  const props = options.props ?? {};

  return{
    name: camelToKebab(options.name),
    closed: options.closed ?? false,
    props: options.props ? normalizeProps(props) : props,
    attrs: mapObject((key) => [ camelToKebab(key), key ], props),
    model: {
      prop: model?.prop ?? 'value',
      event: model?.event ?? 'input',
    },
    setup: setup ?? null,
    styles: options.styles ?? null,
  } as NormalizedFxOptions;
}

/**
 * Defines a new custom element
 * @param {object} options
 * @return {FxElement}
 */
export function defineElement<T extends Readonly<Props>>(options: FxOptions<T>): typeof FxElement {
  const normalized = normalizeOptions(options);
  const attrs = Object.keys(normalized.attrs);

  if (!normalized.name.includes('-')) {
    console.warn('Fx: Component names should include a hyphen (-) or be camelised with at least 2 uppser case characters.');
  }

  const CustomElement = class extends FxElement {
    static get is() {
      return normalized.name;
    }

    static get observedAttributes() {
      return attrs;
    }

    constructor() {
      super(normalized);
    }
  };

  window.customElements.define(normalized.name, CustomElement);
  return CustomElement;
}
