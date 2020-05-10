export declare type TemplatePatcher = (pending: any) => void;
export interface TemplateCompiler {
    attr?(node: HTMLElement, attr: string): TemplatePatcher | void;
    node?(ref: Comment): TemplatePatcher | void;
    text?(node: Text): TemplatePatcher | void;
}
export declare const defaultCompiler: TemplateCompiler;
//# sourceMappingURL=compiler.d.ts.map