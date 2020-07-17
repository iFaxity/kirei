/// <reference types="cypress" />
import { CSSResult, css } from '@kirei/element/dist/css';

const SUPPORTS_ADOPTING_STYLE_SHEETS = CSSResult.supportsAdoptingStyleSheets;

function resetAdoptingStyleSheets() {
  CSSResult.supportsAdoptingStyleSheets = SUPPORTS_ADOPTING_STYLE_SHEETS;
}

describe('css', () => {
  it('#css()', () => {
    const res = css`.red { color: ${'red'}; } div { top: ${100}px; }`;

    assert.instanceOf(res, CSSResult);
    assert.equal(res.cssText, '.red { color: red; } div { top: 100px; }');
  });

  describe('class CSSResult', () => {
    describe('#static adoptStyleSheets()', () => {
      afterEach(resetAdoptingStyleSheets);

      const styleSheets = [
        css`.blue { color: blue; }`,
        css`div { padding: 1em 0.5em; }`,
        css`span.icon { font-size: 1.2em; }`,
      ];

      it('with shadow', () => {
        const $div = document.createElement('div');
        const $shadow = $div.attachShadow({ mode: 'open' });
        const res = CSSResult.adoptStyleSheets($shadow, 'div', styleSheets);

        assert.isTrue(res);
        assert.deepEqual($shadow.adoptedStyleSheets, styleSheets.map(s => s.styleSheet));
      });
      it('without adopt support', () => {
        CSSResult.supportsAdoptingStyleSheets = false;

        const $span = document.createElement('span');
        const $shadow = $span.attachShadow({ mode: 'open' });
        const res = CSSResult.adoptStyleSheets($shadow, 'span', styleSheets);

        assert.isEmpty($shadow.adoptedStyleSheets);
        assert.isFalse(res);
      });
    });

    describe('#constructor()', () => {
      it('with empty strings & values', () => {
        const res = new CSSResult([], []);
        assert.isUndefined(res.cssText);
      });
      it('with one string', () => {
        const res = new CSSResult(['123 Test 456'], []);
        assert.equal(res.cssText, '123 Test 456');
      });
      it('with valid inputs', () => {
        const res = new CSSResult([':', ' has ', ' ', '!'], ['Foo', 20, false]);
        assert.equal(res.cssText, ':Foo has 20 false!');
      });
      it('with more values', () => {
        const res = new CSSResult(['', ' Test '], [123, true, '!']);
        assert.equal(res.cssText, '123 Test trueundefined!undefined');
      });
      it('with more strings', () => {
        const res = new CSSResult(['Hey ', ', this is your ', ' report', '!'], ['user']);
        assert.equal(res.cssText, 'Hey user, this is your ');
      });
      it('with invalid strings', () => {
        const res = new CSSResult([{}, ['__'], 50, true], ['Hi', 456, false]);
        assert.equal(res.cssText, '[object Object]Hi__45650falsetrue');
      });
    });

    it('#toString()', () => {
      const res = new CSSResult(['Hello ', '! Todays lucky number: ', '. ', ''], [ 'World', 7, {} ]);
      assert.equal(res.toString(), 'Hello World! Todays lucky number: 7. [object Object]');
    });

    describe('#styleSheet()', () => {
      afterEach(resetAdoptingStyleSheets);
      it('with adopting shim', () => {
        const res = new CSSResult(['.red { color: ', '; }'], ['red']);
        assert.instanceOf(res.styleSheet, CSSStyleSheet);

        const { rules } = res.styleSheet;
        assert.equal(rules.length, 1);
        assert.equal(rules[0].cssText, '.red { color: red; }');
      });
      it('without adopting shim', () => {
        CSSResult.supportsAdoptingStyleSheets = false;
        const res = new CSSResult([''], []);
        assert.isNull(res.styleSheet);
      });
      it('with invalid content', () => {
        const res = new CSSResult([100, {}], ['foo']);
        assert.instanceOf(res.styleSheet, CSSStyleSheet);
        assert.isEmpty(res.styleSheet.rules);
      });
      it('lazy caching', () => {
        const res = new CSSResult([''], []);

        const styles = res.styleSheet;
        assert.instanceOf(styles, CSSStyleSheet);
        assert.equal(styles, res.styleSheet);
      });
    });
  });
});
