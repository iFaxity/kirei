import { ShadyRenderOptions, TemplateResult } from 'lit-html/lib/shady-render';
import { Fx } from './fx';
import { Props, PropsData, ResolvePropTypes, NormalizedProps } from './props';
import { CSSResult } from './css';
export declare let activeElement: FxElement;
export declare const elementInstances: WeakMap<FxElement, FxInstance>;
interface FxModel {
    prop?: string;
    event?: string;
}
export interface FxOptions<P = Props, T = ResolvePropTypes<P>> {
    name: string;
    closed?: boolean;
    props?: P;
    model?: FxModel;
    setup(this: void, props: T, ctx: FxContext): () => TemplateResult;
    styles?: CSSResult | CSSResult[];
}
interface NormalizedFxOptions extends FxOptions {
    props: NormalizedProps;
    attrs: Record<string, string>;
    styles: CSSResult[];
}
declare class FxContext {
    el: FxElement;
    model: FxModel;
    attrs: Record<string, string>;
    props: NormalizedProps;
    constructor(el: FxElement, instance: NormalizedFxOptions);
    emit(eventName: string, detail?: any): void;
}
declare class FxInstance {
    readonly options: NormalizedFxOptions;
    readonly ctx: FxContext;
    readonly hooks: Record<string, Set<Function>>;
    readonly renderOptions: ShadyRenderOptions;
    readonly fx: Fx;
    readonly props: PropsData;
    readonly shadowRoot: ShadowRoot;
    private renderTemplate;
    private rendering;
    private mounted;
    private shimAdoptedStyleSheets;
    constructor(el: FxElement, options: NormalizedFxOptions);
    setup(): void;
    /**
     * Runs all the specified hooks on the Fx instance
     */
    runHooks(hook: string): void;
    /**
     * Schedules a run to render updated content
     */
    scheduleRender(run: () => void): void;
    /**
     * Renders shadow root content
     */
    render(): void;
}
export declare class FxElement extends HTMLElement {
    static get is(): string;
    constructor(options: NormalizedFxOptions);
    /**
     * Runs when mounted to the dom
     */
    connectedCallback(): void;
    /**
     * Runs when unmounted from dom
     */
    disconnectedCallback(): void;
    /**
     * Observes attribute changes
     */
    attributeChangedCallback(attr: string, oldValue: string, newValue: string): void;
}
/**
 * Defines a new custom element
 * @param {object} options
 * @return {FxElement}
 */
export declare function defineElement<T extends Readonly<Props>>(options: FxOptions<T>): typeof FxElement;
export {};
//# sourceMappingURL=element.d.ts.map