export const supportsAdoptingStyleSheets =
    ('adoptedStyleSheets' in Document.prototype) &&
    ('replace' in CSSStyleSheet.prototype);

/**
  * Creates a new css template
  * @param {TemplateStringsArray} strings
  * @param {*} values
  * @returns {CSSResult}
  */
export const css = (strings: TemplateStringsArray, ...values: any) => new CSSResult(strings, values);

export function shimAdoptedStyleSheets(tag: string, styles: CSSResult[]): boolean {
  if (styles.length) {
    const { ShadyCSS } = window;

    if (ShadyCSS?.nativeShadow === false) {
      ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map(s => s.toString()), tag);
    } else if (supportsAdoptingStyleSheets) {
      this.shadowRoot.adoptedStyleSheets = styles.map(s => s.styleSheet);
    } else {
      return true; // notifies to shim manually using style elements
    }
  }
  return false
}

export class CSSResult {
  private readonly cssText: string;
  private styles: CSSStyleSheet;

  constructor(strings: TemplateStringsArray, values: readonly unknown[]) {
    this.cssText = values.reduce<string>((acc, value, idx) => {
      return acc + value.toString() + strings[idx + 1];
    }, strings[0]);
  }

  /**
   * @returns {CSSStyleSheet}
   */
  get styleSheet() {
    if (typeof this.styles != 'undefined') {
      return this.styles;
    }

    this.styles = null;
    if (supportsAdoptingStyleSheets) {
      this.styles = new CSSStyleSheet();
      this.styles.replaceSync(this.cssText);
    }

    return this.styles;
  }

  /**
   * @returns {HTMLStyleElement}
   */
  createElement(): HTMLStyleElement {
    const $style = document.createElement('style');
    $style.textContent = this.cssText;
    return $style;
  }

  /**
   * @returns {string}
   */
  toString(): string {
    return this.cssText;
  }
}
