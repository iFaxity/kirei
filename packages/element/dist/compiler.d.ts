import { TemplatePatcher } from '@kirei/html';
export declare type DirectiveFactory = (directive: Directive) => TemplatePatcher;
export interface Directive {
    el: HTMLElement;
    name: string;
    arg: string;
    mods: string[];
}
export declare function directive(name: string, directive: DirectiveFactory): void;
export declare const html: import("../../html/dist").TemplateLiteral, svg: import("../../html/dist").TemplateLiteral, render: (template: Node | import("../../html/dist").Template, root: Element | DocumentFragment | ShadowRoot, scopeName?: string) => void;
//# sourceMappingURL=compiler.d.ts.map