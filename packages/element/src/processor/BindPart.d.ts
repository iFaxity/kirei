import { Part } from 'lit-html';
export declare class FxBindPart implements Part {
    readonly element: Element;
    readonly name: string;
    readonly strings: ReadonlyArray<string>;
    value: unknown;
    constructor(element: Element, name: string, strings: ReadonlyArray<string>);
    setValue(value: unknown): void;
    commit(): void;
}
//# sourceMappingURL=BindPart.d.ts.map