import { isUndefined } from '@kirei/shared';

/**
 * Class to easily construct and cache style sheets
 * @class
 */
export class CSSResult {
  private styles: CSSStyleSheet;
  readonly cssText: string;

  /**
   * Boolean to indicate if client supports adopting style sheets,
   *   exposed as static for testing purposes
   * @private
   */
  static supportsAdoptingStyleSheets =
    'adoptedStyleSheets' in Document.prototype &&
    'replace' in CSSStyleSheet.prototype;

  /**
   * Applies adopted stylesheets if available or tries to shim,
   *   returns false if shim has to be done manually through a style tag
   * @param {ShadowRoot} shadowRoot Shadow root to apply styles to
   * @param {string} tag Tag of the parent of the shadow root
   * @param {CSSResult[]} styles Styles to apply
   * @returns {boolean}
   * @private
   */
  static adoptStyleSheets(
    shadowRoot: ShadowRoot,
    tag: string,
    styles: CSSResult[]
  ): boolean {
    if (styles != null && styles.length) {
      const { ShadyCSS } = window;

      if (ShadyCSS?.nativeShadow === false) {
        ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map(s => s.toString()), tag);
      } else if (this.supportsAdoptingStyleSheets) {
        shadowRoot.adoptedStyleSheets = styles.map(s => s.styleSheet);
      } else {
        return false; // notifies to shim manually using style elements
      }
    }

    return true;
  }

  /**
   * Constructs a new CSSResult instance
   * @param {TemplateStringsArray} strings Template strings glue
   * @param {any[]} values Interpolated values
   */
  constructor(strings: TemplateStringsArray, values: readonly any[]) {
    this.cssText = values.reduce<string>((acc, value, idx) => {
      return acc + String(value) + strings[idx + 1];
    }, strings[0]);
  }

  /**
   * Gets the constructible stylesheet
   * @returns {CSSStyleSheet}
   */
  get styleSheet(): CSSStyleSheet {
    if (isUndefined(this.styles)) {
      if (CSSResult.supportsAdoptingStyleSheets) {
        this.styles = new CSSStyleSheet();
        this.styles.replaceSync(this.cssText);
      } else {
        this.styles = null;
      }
    }

    return this.styles;
  }

  /**
   * Gets the CSS styles as a string
   * @returns {string}
   */
  toString(): string {
    return this.cssText;
  }
}

/**
  * Creates a new CSS result from a template literal
  * @param {TemplateStringsArray} strings
  * @param {any[]} values
  * @returns {CSSResult}
  */
export const css = (strings: TemplateStringsArray, ...values: any[]) => new CSSResult(strings, values);
