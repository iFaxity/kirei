import { Template, TemplateCompiler } from './template';
export { defaultCompiler, TemplatePatcher } from './compiler';
export { Template, TemplateCompiler };
declare type RootContainer = Element | ShadowRoot | DocumentFragment;
declare const html: TemplateLiteral, svg: TemplateLiteral, render: (template: Node | Template, root: RootContainer, scopeName?: string) => void;
export { html, svg, render };
declare type Key = string | number | null | undefined;
export interface TemplateLiteral {
    /**
     * Creates a template from a string literal
     */
    (strings: TemplateStringsArray, ...values: any[]): Template;
    /**
     * Caches a template based on a reference or an unique id.
     * @param {*} ref Reference object to cache for
     * @param {string|number|null|undefined} [key] Unique id for the reference
     * @param {Function} template Template to render
     */
    key(ref: object, template: Template): Node;
    key(ref: object, key: Key, template: Template): Node;
}
interface CustomizeOptions<T extends Partial<TemplateLiteral>> {
    compiler?: TemplateCompiler;
    literals?: T;
}
export declare function customize<T extends TemplateLiteral>(opts?: CustomizeOptions<T>): {
    /**
     * Renders a template to a specific root container
     * @param {Template|Node} template Template or Node to render from
     * @param {HTMLElement|ShadowRoot|DocumentFragment} root Root node to render content to
     * @param {string} [scopeName] The custom element tag name, only used for webcomponents shims
     */
    render(template: Node | Template, root: RootContainer, scopeName?: string): void;
    /**
     * Creates a template with html content
     */
    html: T;
    /**
     * Creates a template with svg content
     */
    svg: T;
};
//# sourceMappingURL=index.d.ts.map