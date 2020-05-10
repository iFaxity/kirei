"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supportsAdoptingStyleSheets = ('adoptedStyleSheets' in Document.prototype) &&
    ('replace' in CSSStyleSheet.prototype);
/**
  * Creates a new css template
  * @param {TemplateStringsArray} strings
  * @param {*} values
  * @returns {CSSResult}
  */
exports.css = (strings, ...values) => new CSSResult(strings, values);
/**
 * Applies adopted stylesheets shim, returns false if shim needs
 *  to be done manually through style tags
 * @param {ShadowRoot} shadowRoot Shadow root to apply styles to
 * @param {string} tag Tag of the parent of the shadow root
 * @param {CSSResult[]} styles Styles to apply
 * @returns {boolean}
 */
function shimAdoptedStyleSheets(shadowRoot, tag, styles) {
    if (styles != null && styles.length) {
        const { ShadyCSS } = window;
        if (!(ShadyCSS === null || ShadyCSS === void 0 ? void 0 : ShadyCSS.nativeShadow) === false) {
            ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map(s => s.toString()), tag);
        }
        else if (supportsAdoptingStyleSheets) {
            shadowRoot.adoptedStyleSheets = styles.map(s => s.styleSheet);
        }
        else {
            return true; // notifies to shim manually using style elements
        }
    }
    return false;
}
exports.shimAdoptedStyleSheets = shimAdoptedStyleSheets;
class CSSResult {
    constructor(strings, values) {
        this.cssText = values.reduce((acc, value, idx) => {
            return acc + value.toString() + strings[idx + 1];
        }, strings[0]);
    }
    /**
     * Gets the constructible stylesheet
     * @returns {CSSStyleSheet}
     */
    get styleSheet() {
        if (typeof this.styles == 'undefined') {
            if (supportsAdoptingStyleSheets) {
                this.styles = new CSSStyleSheet();
                this.styles.replaceSync(this.cssText);
            }
            else {
                this.styles = null;
            }
        }
        return this.styles;
    }
    /**
     * Gets the CSS as a string
     * @returns {string}
     */
    toString() {
        return this.cssText;
    }
}
exports.CSSResult = CSSResult;
//# sourceMappingURL=css.js.map