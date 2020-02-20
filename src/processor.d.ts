import { TemplateProcessor, Part, NodePart, RenderOptions } from 'lit-html';
export declare const parts: Map<string, Function>;
/**
 * Creates Parts when a template is instantiated.
 */
export declare class FxTemplateProcessor implements TemplateProcessor {
    handleAttributeExpressions(element: Element, name: string, strings: ReadonlyArray<string>, options: RenderOptions): ReadonlyArray<Part>;
    handleTextExpression(options: RenderOptions): NodePart;
}
export declare const templateProcessor: FxTemplateProcessor;
//# sourceMappingURL=processor.d.ts.map