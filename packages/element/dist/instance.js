"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fx_1 = require("@kirei/fx");
const shared_1 = require("@kirei/shared");
const lifecycle_1 = require("./api/lifecycle");
const Queue = require("./queue");
const css_1 = require("./css");
const compiler_1 = require("./compiler");
const props_1 = require("./props");
const activeInstanceStack = [];
exports.instances = new WeakMap();
class KireiContext {
    /**
     * Instansiates a new setup context for a ElementElement
     * @param {KireiElement} el Element to relate context to
     * @param {NormalizedElementOptions} options Normalized element options
     */
    constructor(el, options) {
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
    emit(eventName, detail, options) {
        let e = typeof detail != 'undefined'
            ? new CustomEvent(eventName, Object.assign({ detail }, options))
            : new Event(eventName, options);
        this.el.dispatchEvent(e);
    }
}
class KireiInstance {
    /**
     * Constructs a new element instance, holds all the functionality to avoid polluting element
     * @param {KireiElement} el Element to create instance from
     * @param {NormalizedElementOptions} opts Normalized element options
     */
    constructor(el, opts) {
        this.shimAdoptedStyleSheets = false;
        const parent = KireiInstance.active;
        // Inherit provides from parent
        if (parent) {
            this.parent = parent;
            this.provides = parent.provides;
        }
        else {
            this.provides = Object.create(null);
        }
        if (opts.directives) {
            this.directives = opts.directives;
        }
        this.el = el;
        this.options = opts;
        this.hooks = Object.create(null);
        this.props = opts.props ? props_1.propDefaults(opts.props) : {};
        this.fx = new fx_1.Fx(this.update.bind(this), {
            lazy: true,
            scheduler: Queue.push,
        });
        this.setup();
        exports.instances.set(el, this);
    }
    static get active() {
        return activeInstanceStack[activeInstanceStack.length - 1];
    }
    static set active(instance) {
        activeInstanceStack.push(instance);
    }
    static resetActive() {
        activeInstanceStack.pop();
    }
    get mounted() {
        var _a;
        return ((_a = this.el) === null || _a === void 0 ? void 0 : _a.parentNode) != null;
    }
    /**
     * Runs the setup function to collect dependencies and hold logic
     * @returns {void}
     */
    setup() {
        const { props, options } = this;
        const { name, setup } = options;
        let proxy;
        let ctx;
        // No need for props or ctx if not in the arguments of the setup method
        if (setup.length >= 1) {
            // Create a custom proxy for the props
            proxy = new Proxy(props, {
                get: (_, key) => {
                    fx_1.Fx.track(props, key);
                    return props[key];
                },
                set: (_, key, value) => {
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
                    shared_1.exception('Props are not deletable, set it to null or undefined instead!', name);
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
        fx_1.Fx.pauseTracking();
        this.template = setup.call(null, proxy, ctx);
        fx_1.Fx.resetTracking();
        KireiInstance.resetActive();
        if (!shared_1.isFunction(this.template)) {
            shared_1.exception('Setup function must return a TemplateGenerator', `${name}#setup`);
        }
    }
    // Create shadow root and shim styles
    mount() {
        const { tag, styles, closed } = this.options;
        this.runHooks(lifecycle_1.HookTypes.BEFORE_MOUNT);
        // Only run shims on first mount
        if (!this.shadowRoot) {
            const { ShadyCSS, ShadowRoot } = window;
            ShadyCSS === null || ShadyCSS === void 0 ? void 0 : ShadyCSS.styleElement(this.el);
            this.shadowRoot = this.el.attachShadow({ mode: closed ? 'closed' : 'open' });
            if (ShadowRoot && this.shadowRoot instanceof ShadowRoot) {
                this.shimAdoptedStyleSheets = css_1.shimAdoptedStyleSheets(this.shadowRoot, tag, styles);
            }
        }
        this.runHooks(lifecycle_1.HookTypes.MOUNT);
        this.fx.scheduleRun();
    }
    // Call unmounting lifecycle hooks
    unmount() {
        this.runHooks(lifecycle_1.HookTypes.UNMOUNT);
    }
    /**
     * Runs all the specified hooks on the Fx instance
     * @param {string} hook Specified hook name
     * @returns {void}
     */
    runHooks(hook, ...args) {
        const hooks = this.hooks[hook];
        if (hooks === null || hooks === void 0 ? void 0 : hooks.size) {
            fx_1.Fx.pauseTracking();
            hooks.forEach(hook => hook.apply(null, args));
            fx_1.Fx.resetTracking();
        }
    }
    /**
     * Renders shadow root content
     * @returns {void}
     */
    update() {
        const { shadowRoot, options, template, mounted } = this;
        this.runHooks(this.mounted ? lifecycle_1.HookTypes.BEFORE_UPDATE : lifecycle_1.HookTypes.BEFORE_MOUNT);
        KireiInstance.active = this;
        compiler_1.render(template(), shadowRoot, options.tag);
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
            this.runHooks(lifecycle_1.HookTypes.UPDATE);
        }
    }
}
exports.KireiInstance = KireiInstance;
// HTMLElement needs ES6 classes to instansiate properly
class KireiElement extends HTMLElement {
    /**
     * Constructs a new KireiElement
     */
    constructor() {
        super();
        const { options } = this.constructor;
        const { props } = new KireiInstance(this, options);
        // Set props on the element
        // Set props as getters/setters on element
        // props should be a readonly reactive object
        for (const key of Object.keys(options.props)) {
            // If prop already exists, then we throw error
            if (this.hasOwnProperty(key)) {
                shared_1.exception(`Prop ${key} is reserved, please use another.`, options.name);
            }
            // Validate props default value
            props_1.validateProp(options.props, key, props[key]);
            Object.defineProperty(this, key, {
                get: () => props[key],
                set: (newValue) => {
                    if (newValue !== props[key]) {
                        // Trigger an update on the element
                        props[key] = fx_1.toReactive(props_1.validateProp(options.props, key, newValue));
                        fx_1.Fx.trigger(props, fx_1.TriggerOpTypes.SET, key);
                    }
                },
            });
        }
    }
    static get is() {
        return this.options.tag;
    }
    static get observedAttributes() {
        // TODO: cache this?
        return Object.keys(this.options.attrs);
    }
    /**
     * Runs when mounted from DOM
     * @returns {void}
     */
    connectedCallback() {
        const instance = exports.instances.get(this);
        instance.mount();
    }
    /**
     * Runs when unmounted from DOM
     * @returns {void}
     */
    disconnectedCallback() {
        const instance = exports.instances.get(this);
        instance.runHooks(lifecycle_1.HookTypes.BEFORE_UNMOUNT);
        Queue.push(instance.unmount);
    }
    /**
     * Observes attribute changes, triggers updates on props
     * @returns {void}
     */
    attributeChangedCallback(attr, oldValue, newValue) {
        // newValue & oldValue null if not set, string if set, default to empty string
        if (oldValue !== newValue) {
            const { options } = this.constructor;
            const key = options.attrs[attr];
            this[key] = newValue;
        }
    }
}
exports.KireiElement = KireiElement;
//# sourceMappingURL=instance.js.map