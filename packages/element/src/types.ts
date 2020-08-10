import type { Template } from '@kirei/html';
import type { CSSResult } from './css';
import type { InjectionKey } from './api/inject';
import type { DirectiveFactory } from './compiler';
import type { Props, PropsData, ResolvePropTypes, NormalizedProps } from './props';
export interface SyncOptions {
    prop: string;
    event?: string;
}
export interface ElementOptions<P = Props, T = ResolvePropTypes<P>> {
    name: string;
    closed?: boolean;
    props?: P;
    sync?: string | SyncOptions;
    setup(this: void, props: T, ctx: IKireiContext): () => (Template | Node);
    styles?: CSSResult | CSSResult[];
    directives?: Record<string, DirectiveFactory>;
}
export interface NormalizedElementOptions extends Required<ElementOptions> {
    tag: string;
    props: NormalizedProps;
    attrs: Record<string, string>;
    styles: CSSResult[];
    sync: SyncOptions;
    hooks?: Record<string, Function[]>;
    filename?: string;
    attributes: string[];
    provides?: Record<string | number | symbol, any>;
}
export interface IKireiContext {
    readonly el: IKireiElement;
    readonly sync: SyncOptions;
    readonly attrs: Record<string, string>;
    readonly props: NormalizedProps;
    /**
     * Dispatches an event from the host element
     * @param {string} eventName Event to emit
     * @param {*} detail Custom event value
     * @returns {void}
     */
    emit(eventName: string, detail?: any, options?: EventInit): void;
}
export interface IKireiInstance {
    readonly parent?: IKireiInstance;
    readonly el: IKireiElement;
    options: NormalizedElementOptions;
    props: PropsData;
    directives?: Record<string, DirectiveFactory>;
    provides: Record<string | number | symbol, any>;
    /**
     * Checks if the element instance is currently mounted
     * @returns {boolean}
     */
    readonly mounted: boolean;
    /**
     * Runs the setup function to collect dependencies and run logic
     */
    setup(): void;
    /**
     * Provides a value for the instance
     */
    provide<T>(key: InjectionKey<T> | string, value: T): void;
    /**
     * Pushes this instance to the front of the active stack
     */
    activate(): void;
    /**
     * Removes this instance from the front of the active stack
     * Will be no-op of the instance is not at the front
     */
    deactivate(): void;
    /**
     * Create shadow root and shim styles
     */
    mount(): void;
    /**
     * Call unmounting lifecycle hooks
     */
    unmount(): void;
    /**
     * Runs all the specified hooks on the Fx instance
     * @param {string} hook Specified hook name
     */
    runHooks(hook: string, ...args: any[]): void;
    /**
     * Adds a lifecycle hook to instance
     */
    injectHook(name: string, hook: Function): void;
    /**
     * Renders shadow root content
     */
    update(): void;
}
export interface IKireiElement extends HTMLElement {
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
//# sourceMappingURL=types.d.ts.map
