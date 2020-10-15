import { isUndefined } from '@kirei/shared';
import { LRUWeakMap } from '@kirei/html';

/**
 * Cache to store precompiled templates indexed by the template strings
 * as a LRUCache it only stores the most recently used elements.
 * Effectively trading memory for performance and performance for memory.
 * @const
 */
const styleSheetCache = new LRUWeakMap<TemplateStringsArray, CSSStyleSheet>(500);

/**
 * Class to easily construct and cache style sheets
 * @class
 */
export class CSSResult {
  /**
   * Boolean to indicate if client supports adopting style sheets,
   *   exposed as static for testing purposes
   * @private
   * @constant
   */
  static readonly supportsAdoptingStyleSheets =
    'adoptedStyleSheets' in Document.prototype &&
    'replace' in CSSStyleSheet.prototype;

  /**
   * Cached stylesheet, created by the styleSheet getter
   * @var {CSSStyleSheet}
   */
  private styles: CSSStyleSheet;

  /**
   * Raw CSS styles, as passed in to the template literal
   * @var {string}
   */
  readonly cssText: string;

  /**
   * Used to get stylesheets from cache
   * @var {TemplateStringsArray}
   */
  private strings: TemplateStringsArray;

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
        ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map(String), tag);
      } else if (this.supportsAdoptingStyleSheets) {
        // Stylesheets are loaded async
        const promises = styles.map(s => s.styleSheet());
        Promise.all(promises).then(res => {
          shadowRoot.adoptedStyleSheets = res;
        });
        //shadowRoot.adoptedStyleSheets = styles.map(s => s.styleSheet);
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
    // TODO: values doesn't work with caching, look at css variable solution to be more versatile
    this.cssText = values.reduce<string>((acc, value, idx) => {
      return acc + String(value) + strings[idx + 1];
    }, strings[0]);

    this.strings = strings;
  }

  /**
   * Gets the constructible stylesheet
   * @returns {CSSStyleSheet}
   */
  async styleSheet(): Promise<CSSStyleSheet> {
    if (isUndefined(this.styles)) {
      if (CSSResult.supportsAdoptingStyleSheets) {
        // Get stylsheet from cache
        let styles = styleSheetCache.get(this.strings);
        if (!styles) {
          styles = new CSSStyleSheet();
          await styles.replace(this.cssText);
          styleSheetCache.set(this.strings, this.styles);
        }

        this.styles = styles;
      } else {
        this.styles = null;
      }
    }

    return this.styles;
  }

  /**
   * Gets the raw CSS styles as a string
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
export function css(strings: TemplateStringsArray, ...values: any[]): CSSResult {
  return new CSSResult(strings, values);
}
