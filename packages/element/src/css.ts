import { isUndefined } from '@kirei/shared';

/**
 * Class to easily construct and cache style sheets, through template literals
 */
export class CSSResult {
  /**
   * Boolean to indicate if client supports adopting style sheets,
   *   exposed as static for testing purposes
   * @private
   */
  static readonly supportsAdoptingStyleSheets =
    'adoptedStyleSheets' in Document.prototype &&
    'replace' in CSSStyleSheet.prototype;

  /**
   * Cached stylesheet, created by the generate() method
   */
  private styleSheet: Promise<CSSStyleSheet>;

  /**
   * Raw CSS styles, as passed in to the template literal
   */
  readonly cssText: string;

  /**
   * Applies adopted stylesheets if available or tries to shim,
   *   returns false if shim has to be done manually through a style tag.
   * if adopted stylesheets is supported in the browser, they will be loaded async
   * @param shadowRoot - Shadow root to apply styles to
   * @param tag - Tag of the parent of the shadow root
   * @param styles - Styles to apply
   * @returns If adopting is supported returns true
   * @private
   */
  static async adoptStyleSheets(
    shadowRoot: ShadowRoot,
    tag: string,
    styles: CSSResult[]
  ): Promise<boolean> {
    if (styles != null && styles.length) {
      const { ShadyCSS } = window;

      if (ShadyCSS?.nativeShadow === false) {
        ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map(String), tag);
      } else if (this.supportsAdoptingStyleSheets) {
        // Stylesheets are loaded async
        const styleSheets = await Promise.all(styles.map(s => s.generate()));
        shadowRoot.adoptedStyleSheets = styleSheets;

        /*const promises = styles.map(s => s.generate());
        await Promise.all(promises).then(res => {
          shadowRoot.adoptedStyleSheets = res;
        });*/
      } else {
        return false; // notifies to shim manually using style elements
      }
    }

    return true;
  }

  /**
   * Constructs a new CSSResult instance
   * @param strings - Template strings glue
   * @param values - Interpolated values
   */
  constructor(strings: TemplateStringsArray, values: readonly any[]) {
    // TODO: values doesn't work with caching, look at css variable solution to be more versatile
    this.cssText = values.reduce<string>((acc, value, idx) => {
      return acc + String(value) + strings[idx + 1];
    }, strings[0]);
  }

  /**
   * Generates the constructible stylesheet, singleton cached
   * @returns A promise that returns a stylesheet
   */
  generate(): Promise<CSSStyleSheet> {
    if (isUndefined(this.styleSheet)) {
      if (CSSResult.supportsAdoptingStyleSheets) {
        const styleSheet = new CSSStyleSheet();

        this.styleSheet = styleSheet.replace(this.cssText).then(() => styleSheet);
      } else {
        this.styleSheet = Promise.resolve(null);
      }
    }

    return this.styleSheet;
  }

  /**
   * Gets the raw CSS styles as a string
   * @returns A string with the CSS content
   */
  toString(): string {
    return this.cssText;
  }
}

/**
  * Creates a new CSS result from a template literal
  * @param strings - Template strings as a glue for the values
  * @param values - Dynamic values to interpolate
  * @returns An object that represents a CSS Stylesheet
  */
export function css(strings: TemplateStringsArray, ...values: any[]): CSSResult {
  return new CSSResult(strings, values);
}
