import { Template } from '@kirei/html';
import { Fx } from '@kirei/fx';
import { CSSResult } from './css';
import { DirectiveFactory } from './compiler';
import { Props, PropsData, ResolvePropTypes, NormalizedProps } from './props';
export declare const instances: WeakMap<KireiElement, KireiInstance>;
export interface ElementOptions<P = Props, T = ResolvePropTypes<P>> {
    name: string;
    closed?: boolean;
    props?: P;
    sync?: string;
    setup(this: void, props: T, ctx: KireiContext): () => (Template | Node);
    styles?: CSSResult | CSSResult[];
    directives?: Record<string, DirectiveFactory>;
}
export interface NormalizedElementOptions extends Required<ElementOptions> {
    tag: string;
    props: NormalizedProps;
    attrs: Record<string, string>;
    styles: CSSResult[];
}
declare class KireiContext {
    readonly el: KireiElement;
    readonly sync: string;
    readonly attrs: Record<string, string>;
    readonly props: NormalizedProps;
    /**
     * Instansiates a new setup context for a ElementElement
     * @param {KireiElement} el Element to relate context to
     * @param {NormalizedElementOptions} options Normalized element options
     */
    constructor(el: KireiElement, options: NormalizedElementOptions);
    /**
     * Dispatches an event from the host element
     * @param {string} eventName Event to emit
     * @param {*} detail Custom event value
     * @returns {void}
     */
    emit(eventName: string, detail?: any, options?: EventInit): void;
}
export declare class KireiInstance {
    private template;
    private shimAdoptedStyleSheets;
    private shadowRoot;
    readonly parent: KireiInstance;
    readonly el: KireiElement;
    readonly options: NormalizedElementOptions;
    readonly hooks: Record<string, Set<Function>>;
    readonly fx: Fx;
    readonly props: PropsData;
    readonly directives?: Record<string, DirectiveFactory>;
    provides: Record<string | symbol, any>;
    static get active(): KireiInstance;
    static set active(instance: KireiInstance);
    static resetActive(): void;
    get mounted(): boolean;
    /**
     * Constructs a new element instance, holds all the functionality to avoid polluting element
     * @param {KireiElement} el Element to create instance from
     * @param {NormalizedElementOptions} opts Normalized element options
     */
    constructor(el: KireiElement, opts: NormalizedElementOptions);
    /**
     * Runs the setup function to collect dependencies and hold logic
     * @returns {void}
     */
    setup(): void;
    mount(): void;
    unmount(): void;
    /**
     * Runs all the specified hooks on the Fx instance
     * @param {string} hook Specified hook name
     * @returns {void}
     */
    runHooks(hook: string, ...args: any[]): void;
    /**
     * Renders shadow root content
     * @returns {void}
     */
    update(): void;
}
export declare class KireiElement extends HTMLElement {
    static options: NormalizedElementOptions;
    static get is(): string;
    static get observedAttributes(): string[];
    /**
     * Constructs a new KireiElement
     */
    constructor();
    /**
     * Runs when mounted from DOM
     * @returns {void}
     */
    connectedCallback(): void;
    /**
     * Runs when unmounted from DOM
     * @returns {void}
     */
    disconnectedCallback(): void;
    /**
     * Observes attribute changes, triggers updates on props
     * @returns {void}
     */
    attributeChangedCallback(attr: string, oldValue: string, newValue: string): void;
}
export {};
//# sourceMappingURL=instance.d.ts.map