import { isUndefined } from '@kirei/shared';
import { warn } from '../warn';

/**
 * StyleSheets to use with adoptStyleSheets
 */
export type StyleSheet = CSSResult | CSSStyleSheet;

/**
 * Maps a stylesheet into a string of css rules
 * @private
 */
function mapStyleSheetsToCssText(sheet: StyleSheet): string {
  if (sheet instanceof CSSStyleSheet) {
    // TODO: performance?
    let cssText = '';
    for (let i = 0; i < sheet.cssRules.length; i++) {
      cssText += `${sheet.cssRules[i].cssText}\n`;
    }

    return cssText;
  } else if (sheet instanceof CSSResult) {
    return sheet.toString();
  } else if (__DEV__) {
    warn(`Invlaid stylesheet, expected a css literal or a native CSSStyleSheet, got ${typeof sheet}`);
  }
}

/**
 * Maps a Stylesheet into a native CSSStyleSheet
 * @private
 */
async function mapStyleSheetToCssStyleSheet(sheet: StyleSheet): Promise<CSSStyleSheet> {
  if (sheet instanceof CSSStyleSheet) {
    return sheet;
  } else if (sheet instanceof CSSResult) {
    return sheet.generate();
  } else if (__DEV__) {
    warn(`Invlaid stylesheet, expected a css literal or a native CSSStyleSheet, got ${typeof sheet}`);
  }
}

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
export async function adoptStyleSheets(shadowRoot: ShadowRoot, tag: string, styles: StyleSheet[]): Promise<boolean> {
  if (styles != null && styles.length) {
    const { ShadyCSS } = window;

    if (ShadyCSS?.nativeShadow === false) {
      // styles can be a native CSSStyleSheet, we then need to map it
      const cssTexts = styles.map(mapStyleSheetsToCssText)
        .filter(sheet => sheet);

      ShadyCSS.ScopingShim.prepareAdoptedCssText(cssTexts, tag);
    } else if (CSSResult.supportsAdoptingStyleSheets) {
      // Stylesheets are loaded async to support @import rules
      const styleSheets = await Promise.all(styles.map(mapStyleSheetToCssStyleSheet));
      shadowRoot.adoptedStyleSheets = styleSheets.filter(sheet => sheet);
    } else {
      return false; // notifies to shim manually using style elements
    }
  }

  return true;
}

/**
 * Class to easily construct and cache style sheets, through template literals
 */
export class CSSResult {
  /**
   * Only used for testing, changing this could create problems
   * @private
   */
  static supportsAdoptingStyleSheets =
    'adoptedStyleSheets' in Document.prototype &&
    'replace' in CSSStyleSheet.prototype;

  /**
   * Cached stylesheet, created by the generate() method
   */
  private styleSheet: CSSStyleSheet;

  /**
   * Raw CSS styles, as passed in to the template literal
   */
  readonly cssText: string;

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
  async generate(): Promise<CSSStyleSheet> {
    if (isUndefined(this.styleSheet)) {
      if (CSSResult.supportsAdoptingStyleSheets) {
        this.styleSheet = new CSSStyleSheet();

        await this.styleSheet.replace(this.cssText);
      } else {
        this.styleSheet = null;
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
export function css(strings: TemplateStringsArray, ...values: readonly any[]): CSSResult {
  return new CSSResult(strings, values);
}
