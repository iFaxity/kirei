import * as Lit from 'lit-html';
import { Fx } from './fx';
import { Props, ResolvePropTypes, NormalizedProps } from './props';
export declare type LitTemplate = (strings: any, ...values: any[]) => Lit.TemplateResult;
export declare const html: (strings: any, ...values: any[]) => Lit.TemplateResult;
export declare const svg: (strings: any, ...values: any[]) => Lit.TemplateResult;
export declare let activeElement: any;
export declare enum HookTypes {
    BEFORE_MOUNT = "beforeMount",
    MOUNTED = "mounted",
    BEFORE_UPDATE = "beforeUpdate",
    UPDATED = "updated",
    BEFORE_UNMOUNT = "beforeUnmount",
    UNMOUNTED = "unmounted"
}
interface FxModel {
    prop?: string;
    event?: string;
}
export interface FxOptions<P = Props, T = Readonly<ResolvePropTypes<P>>> {
    name: string;
    private?: boolean;
    props?: P;
    model?: FxModel;
    setup(this: void, props: T, ctx: FxContext): () => Lit.TemplateResult;
    styles?: string;
}
interface FxInstance extends FxOptions {
    props: NormalizedProps;
    hooks: Record<string, Function[]>;
    attrs: Record<string, string>;
}
declare class FxContext {
    el: FxElement;
    model: FxModel;
    attrs: Record<string, string>;
    props: NormalizedProps;
    constructor(el: FxElement, instance: FxInstance);
    emit(eventName: string, detail?: any): void;
}
/**
 * Defines a new custom element
 */
export declare function define<T extends Readonly<Props>>(options: FxOptions<T>): typeof FxElement;
export declare class FxElement extends HTMLElement {
    readonly _ctx: FxContext;
    readonly _styles?: string;
    readonly _hooks: Record<string, Function[]>;
    readonly _renderOptions: Lit.RenderOptions;
    readonly _fx: Fx;
    readonly _private: boolean;
    private _renderTemplate;
    private _updating;
    private _mounted;
    private _renderRoot;
    constructor(instance: FxInstance);
    /**
     * Runs when mounted to the dom
     */
    connectedCallback(): void;
    /**
     * Runs when unmounted from dom
     */
    disconnectedCallback(): void;
    /**
     * Observed attribute changed
     */
    attributeChangedCallback(attr: string, oldValue: string, newValue: string): void;
    /**
     * Calls the hooks on the Fx instance
     */
    _callHooks(hook: any): void;
    /**
     * Schedules a run to render updated content
     */
    _scheduleRender(run: any): void;
    /**
     * Renders shadow root content
     */
    _render(): void;
}
export {};
//# sourceMappingURL=element.d.ts.map