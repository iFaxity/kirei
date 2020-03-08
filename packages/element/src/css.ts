export const supportsAdoptingStyleSheets =
    ('adoptedStyleSheets' in Document.prototype) &&
    ('replace' in CSSStyleSheet.prototype);

export const css = (strings, ...values) => new CSSResult(strings, values);

export class CSSResult {
  readonly cssText: string;
  private _styleSheet: CSSStyleSheet;

  constructor(strings: TemplateStringsArray, values: readonly unknown[]) {
    this.cssText = values.reduce<string>((acc, value, idx) => {
      return acc + value.toString() + strings[idx + 1];
    }, strings[0]);
  }

  get styleSheet(): CSSStyleSheet|null {
    if (typeof this._styleSheet == 'undefined') {
      if (supportsAdoptingStyleSheets) {
        this._styleSheet = new CSSStyleSheet();
        // @ts-ignore
        this._styleSheet.replaceSync(this.cssText);
      } else {
        this._styleSheet = null;
      }
    }

    return this._styleSheet;
  }

  createElement(): HTMLStyleElement {
    const $style = document.createElement('style');
    $style.textContent = this.cssText;
    return $style;
  }

  toString(): string {
    return this.cssText;
  }
}
