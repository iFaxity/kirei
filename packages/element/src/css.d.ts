export declare const supportsAdoptingStyleSheets: boolean;
export declare const css: (strings: any, ...values: any[]) => CSSResult;
export declare class CSSResult {
    readonly cssText: string;
    private _styleSheet;
    constructor(strings: TemplateStringsArray, values: readonly unknown[]);
    get styleSheet(): CSSStyleSheet | null;
    createElement(): HTMLStyleElement;
    toString(): string;
}
//# sourceMappingURL=css.d.ts.map