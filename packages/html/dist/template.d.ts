import { TemplateCompiler, TemplatePatcher } from './compiler';
export { TemplateCompiler };
export interface TemplateCache {
    stack: TemplateCache[];
    instance: TemplateInstance;
    node: Node;
}
interface TemplateInstance {
    strings: TemplateStringsArray;
    type: string;
    patchers: TemplatePatcher[];
    root: DocumentFragment;
}
export declare function createCache(): TemplateCache;
export declare class Template {
    readonly type: string;
    readonly strings: TemplateStringsArray;
    readonly values: any[];
    constructor(type: string, strings: TemplateStringsArray, values: any[]);
    update(cache: TemplateCache, compiler: TemplateCompiler, scopeName?: string): Node;
}
//# sourceMappingURL=template.d.ts.map