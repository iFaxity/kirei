// @ts-nocheck
/// <reference types="cypress" />
import { CSSResult, css } from '@kirei/element/src/css';

const SUPPORTS_ADOPTING_STYLE_SHEETS = CSSResult.supportsAdoptingStyleSheets;

function resetAdoptingStyleSheets() {
  CSSResult.supportsAdoptingStyleSheets = SUPPORTS_ADOPTING_STYLE_SHEETS;
}

function disableAdoptingStyleSheets() {
  CSSResult.supportsAdoptingStyleSheets = false;
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

        if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
          assert.isTrue(res);
          assert.deepEqual($shadow.adoptedStyleSheets, styleSheets.map(s => s.styleSheet));
        } else {
          assert.isFalse(res);
          assert.notProperty($shadow, 'adoptedStyleSheets');
          assert.deepEqual([ null, null, null ], styleSheets.map(s => s.styleSheet));
        }

      });
      it('without adopt support', () => {
        disableAdoptingStyleSheets();

        const $span = document.createElement('span');
        const $shadow = $span.attachShadow({ mode: 'open' });
        const res = CSSResult.adoptStyleSheets($shadow, 'span', styleSheets);

        if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
          assert.isEmpty($shadow.adoptedStyleSheets);
        } else {
          assert.notProperty($shadow, 'adoptedStyleSheets');
        }

        assert.isFalse(res);
      });
    });

    describe('#constructor()', () => {
      it('with empty strings & values', () => {
        const res = new CSSResult([] as any, []);
        assert.isUndefined(res.cssText);
      });
      it('with one string', () => {
        const res = new CSSResult(['123 Test 456'] as any, []);
        assert.equal(res.cssText, '123 Test 456');
      });
      it('with valid inputs', () => {
        const res = new CSSResult([':', ' has ', ' ', '!'] as any, ['Foo', 20, false]);
        assert.equal(res.cssText, ':Foo has 20 false!');
      });
      it('with more values', () => {
        const res = new CSSResult(['', ' Test '] as any, [123, true, '!']);
        assert.equal(res.cssText, '123 Test trueundefined!undefined');
      });
      it('with more strings', () => {
        const res = new CSSResult(['Hey ', ', this is your ', ' report', '!'] as any, ['user']);
        assert.equal(res.cssText, 'Hey user, this is your ');
      });
      it('with invalid strings', () => {
        const res = new CSSResult([{}, ['__'], 50, true] as any, ['Hi', 456, false]);
        assert.equal(res.cssText, '[object Object]Hi__45650falsetrue');
      });
    });

    it('#toString()', () => {
      const res = new CSSResult(['Hello ', '! Todays lucky number: ', '. ', ''] as any, [ 'World', 7, {} ]);
      assert.equal(res.toString(), 'Hello World! Todays lucky number: 7. [object Object]');
    });

    describe('#styleSheet()', () => {
      afterEach(resetAdoptingStyleSheets);

      it('with adopting shim', () => {
        const res = new CSSResult(['.red { color: ', '; }'] as any, ['red']);

        if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
          assert.instanceOf(res.styleSheet, CSSStyleSheet);

          const { rules } = res.styleSheet;
          assert.equal(rules.length, 1);
          assert.equal(rules[0].cssText, '.red { color: red; }');
        } else {
          assert.isNull(res.styleSheet);
        }
      });
      it('without adopting shim', () => {
        disableAdoptingStyleSheets();
        const res = new CSSResult([''] as any, []);
        assert.isNull(res.styleSheet);
      });
      it('with invalid content', () => {
        const res = new CSSResult([100, {}] as any, ['foo']);

        if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
          assert.instanceOf(res.styleSheet, CSSStyleSheet);
          assert.isEmpty(res.styleSheet.rules);
        } else {
          assert.isNull(res.styleSheet);
        }
      });
      it('lazy caching', () => {
        const res = new CSSResult([''] as any, []);
        const styles = res.styleSheet;

        if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
          assert.instanceOf(styles, CSSStyleSheet);
        } else {
          assert.isNull(styles);
        }

        assert.equal(styles, res.styleSheet);
      });
    });
  });
});
