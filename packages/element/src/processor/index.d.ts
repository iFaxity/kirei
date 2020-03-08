import { TemplateProcessor, AttributePart, AttributeCommitter, BooleanAttributePart, NodePart, PropertyCommitter, Part, RenderOptions } from 'lit-html';
export { Part, RenderOptions };
export declare class FxAttributePart extends AttributePart {
    readonly name: string;
    readonly mapValue: boolean;
    constructor(committer: AttributeCommitter, name: string);
    setValue(value: unknown): void;
}
export declare class FxNodePart extends NodePart {
    setValue(value: unknown): void;
}
export declare class FxBooleanAttributePart extends BooleanAttributePart {
    setValue(value: unknown): void;
}
export declare class FxAttributeCommitter extends AttributeCommitter {
    protected _createPart(): AttributePart;
}
export declare class FxPropertyCommitter extends PropertyCommitter {
    protected _createPart(): AttributePart;
}
/**
 * Creates Parts when a template is instantiated.
 */
export declare class FxTemplateProcessor implements TemplateProcessor {
    handleAttributeExpressions(el: Element, name: string, strings: ReadonlyArray<string>, options: RenderOptions): ReadonlyArray<Part>;
    handleTextExpression(options: RenderOptions): NodePart;
}
declare type PartsFunction = (el: Element, name: string, strings?: ReadonlyArray<string>, options?: RenderOptions) => readonly Part[];
export declare const templateProcessor: FxTemplateProcessor;
export declare const parts: Map<string, PartsFunction>;
//# sourceMappingURL=index.d.ts.map