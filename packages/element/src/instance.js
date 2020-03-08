import { render, TemplateResult } from 'lit-html/lib/shady-render';
import { isFunction, mapObject, camelToKebab, HookTypes } from './shared';
import { Fx, TriggerOpTypes } from './fx';
import { toReactive } from './reactive';
import * as Queue from './queue';
import { validateProp, normalizeProps, propDefaults, } from './props';
import { supportsAdoptingStyleSheets } from './css';
export let activeElement = null;
const activeElementStack = [];
export const elementInstances = new WeakMap();
class FxContext {
    constructor(el, instance) {
        this.el = el;
        this.model = instance.model;
        this.attrs = instance.attrs;
        this.props = instance.props;
    }
    emit(eventName, detail) {
        let e = typeof detail != 'undefined'
            ? new CustomEvent(eventName, { detail })
            : new Event(eventName);
        this.el.dispatchEvent(e);
    }
}
class FxInstance {
    constructor(el, options) {
        this.rendering = false;
        this.mounted = false;
        this.shimAdoptedStyleSheets = false;
        this.options = options;
        this.ctx = new FxContext(el, options);
        this.hooks = mapObject((_, value) => [value, new Set()], HookTypes);
        this.renderOptions = { scopeName: options.name, eventContext: el };
        this.fx = new Fx(this.render.bind(this), {
            lazy: true,
            computed: false,
            scheduler: this.scheduleRender.bind(this),
        });
        this.props = propDefaults(options.props);
        this.shadowRoot = el.attachShadow({ mode: options.closed ? 'closed' : 'open' });
    }
    setup() {
        const { props, ctx, options } = this;
        // Create a proxy for the props
        const propsProxy = new Proxy(props, {
            get(_, key) {
                Fx.track(props, key);
                return props[key];
            },
            set(_, key, value) {
                props[key] = value;
                Fx.trigger(props, TriggerOpTypes.SET, key);
                ctx.emit(`fxsync:${key}`);
                return true;
            },
            deleteProperty() {
                throw new Error('Props are not deletable');
            },
        });
        // Run setup function to gather reactive data
        this.renderTemplate = options.setup.call(undefined, propsProxy, ctx);
        if (!isFunction(this.renderTemplate)) {
            throw new TypeError('Setup functions must return a function which return a TemplateResult');
        }
        // Shim styles for shadow root
        if (window.ShadowRoot && this.shadowRoot instanceof window.ShadowRoot) {
            const { ShadyCSS } = window;
            const { styles } = options;
            if (!styles.length) {
                return;
            }
            if (ShadyCSS === null || ShadyCSS === void 0 ? void 0 : ShadyCSS.nativeShadow) {
                ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map(s => s.toString()), options.name);
            }
            else if (supportsAdoptingStyleSheets) {
                this.shadowRoot.adoptedStyleSheets = styles.map(s => s.styleSheet);
            }
            else {
                this.shimAdoptedStyleSheets = true;
            }
        }
    }
    /**
     * Runs all the specified hooks on the Fx instance
     */
    runHooks(hook) {
        const hooks = this.hooks[hook];
        if (hooks === null || hooks === void 0 ? void 0 : hooks.size) {
            hooks.forEach(fn => isFunction(fn) && fn.call(undefined));
        }
    }
    /**
     * Schedules a run to render updated content
     */
    scheduleRender(run) {
        // Prevent overlapping renders
        if (this.rendering)
            return;
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
    render() {
        const { shadowRoot, options } = this;
        const result = this.renderTemplate();
        if (!(result instanceof TemplateResult)) {
            throw new Error('FxElement.render() must return a TemplateResult');
        }
        render(result, shadowRoot, this.renderOptions);
        if (this.shimAdoptedStyleSheets) {
            for (const style of options.styles) {
                shadowRoot.appendChild(style.createElement());
            }
            this.shimAdoptedStyleSheets = false;
        }
    }
}
// HTMLElement needs es6 classes to instansiate properly
export class FxElement extends HTMLElement {
    static get is() {
        return '';
    }
    constructor(options) {
        var _a;
        super();
        activeElement = this;
        activeElementStack.push(this);
        const instance = new FxInstance(this, options);
        elementInstances.set(this, instance);
        instance.setup();
        activeElement = (_a = activeElementStack[activeElementStack.length - 1]) !== null && _a !== void 0 ? _a : null;
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
                get: () => {
                    Fx.track(propsData, key);
                    return propsData[key];
                },
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
     * Runs when mounted to the dom
     */
    connectedCallback() {
        var _a;
        const instance = elementInstances.get(this);
        instance.runHooks(HookTypes.BEFORE_MOUNT);
        (_a = window.ShadyCSS) === null || _a === void 0 ? void 0 : _a.styleElement(this);
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
    attributeChangedCallback(attr, oldValue, newValue) {
        // newValue & oldValue null if not set, string if set, default to empty string
        if (oldValue !== newValue) {
            const instance = elementInstances.get(this);
            const { attrs } = instance.options;
            const key = attrs[attr];
            this[key] = newValue;
        }
    }
}
function addStyles(styles, set) {
    return styles.reduceRight((set, s) => Array.isArray(s) ? addStyles(s, set) : (set.add(s), set), set);
}
/**
 * Normalizes the options object
 * @param {object} options
 * @returns {object}
 */
function normalizeOptions(options) {
    var _a, _b, _c, _d;
    const { setup, model, styles } = options;
    const props = (_a = options.props) !== null && _a !== void 0 ? _a : {};
    let css = [];
    if (styles) {
        if (Array.isArray(styles)) {
            const set = addStyles(styles, new Set());
            css = [...set];
        }
        else {
            css.push(styles);
        }
    }
    return {
        name: camelToKebab(options.name),
        closed: (_b = options.closed) !== null && _b !== void 0 ? _b : false,
        props: options.props ? normalizeProps(props) : props,
        attrs: mapObject((key) => [camelToKebab(key), key], props),
        model: {
            prop: (_c = model === null || model === void 0 ? void 0 : model.prop) !== null && _c !== void 0 ? _c : 'value',
            event: (_d = model === null || model === void 0 ? void 0 : model.event) !== null && _d !== void 0 ? _d : 'input',
        },
        setup: setup !== null && setup !== void 0 ? setup : null,
        styles: css,
    };
}
/**
 * Defines a new custom element
 * @param {object} options
 * @return {FxElement}
 */
export function defineElement(options) {
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
//# sourceMappingURL=instance.js.map