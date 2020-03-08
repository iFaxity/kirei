import { Part } from 'lit-html';
export declare class FxConditionalPart implements Part {
    readonly element: Element;
    readonly name: string;
    readonly strings: ReadonlyArray<string>;
    value: unknown;
    private __pendingValue;
    private comment;
    constructor(element: Element, name: string, strings: ReadonlyArray<string>);
    setValue(value: unknown): void;
    commit(): void;
}
//# sourceMappingURL=ConditionalPart.d.ts.map