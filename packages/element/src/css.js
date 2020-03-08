export const supportsAdoptingStyleSheets = ('adoptedStyleSheets' in Document.prototype) &&
    ('replace' in CSSStyleSheet.prototype);
export const css = (strings, ...values) => new CSSResult(strings, values);
export class CSSResult {
    constructor(strings, values) {
        this.cssText = values.reduce((acc, value, idx) => {
            return acc + value.toString() + strings[idx + 1];
        }, strings[0]);
    }
    get styleSheet() {
        if (typeof this._styleSheet == 'undefined') {
            if (supportsAdoptingStyleSheets) {
                this._styleSheet = new CSSStyleSheet();
                // @ts-ignore
                this._styleSheet.replaceSync(this.cssText);
            }
            else {
                this._styleSheet = null;
            }
        }
        return this._styleSheet;
    }
    createElement() {
        const $style = document.createElement('style');
        $style.textContent = this.cssText;
        return $style;
    }
    toString() {
        return this.cssText;
    }
}
//# sourceMappingURL=css.js.map