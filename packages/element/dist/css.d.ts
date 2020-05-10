/**
  * Creates a new css template
  * @param {TemplateStringsArray} strings
  * @param {*} values
  * @returns {CSSResult}
  */
export declare const css: (strings: TemplateStringsArray, ...values: any) => CSSResult;
/**
 * Applies adopted stylesheets shim, returns false if shim needs
 *  to be done manually through style tags
 * @param {ShadowRoot} shadowRoot Shadow root to apply styles to
 * @param {string} tag Tag of the parent of the shadow root
 * @param {CSSResult[]} styles Styles to apply
 * @returns {boolean}
 */
export declare function shimAdoptedStyleSheets(shadowRoot: ShadowRoot, tag: string, styles: CSSResult[]): boolean;
export declare class CSSResult {
    private readonly cssText;
    private styles;
    constructor(strings: TemplateStringsArray, values: readonly unknown[]);
    /**
     * Gets the constructible stylesheet
     * @returns {CSSStyleSheet}
     */
    get styleSheet(): CSSStyleSheet;
    /**
     * Gets the CSS as a string
     * @returns {string}
     */
    toString(): string;
}
//# sourceMappingURL=css.d.ts.map