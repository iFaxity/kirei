// @ts-nocheck
/// <reference types="cypress" />
import { CSSResult, css, adoptStyleSheets, StyleSheet } from '@kirei/element/runtime/css';

const SUPPORTS_ADOPTING_STYLE_SHEETS = CSSResult.supportsAdoptingStyleSheets;

function resetAdoptingStyleSheets(): void {
  CSSResult.supportsAdoptingStyleSheets = SUPPORTS_ADOPTING_STYLE_SHEETS;
}

function disableAdoptingStyleSheets(): void {
  CSSResult.supportsAdoptingStyleSheets = false;
}

function createStyleSheet(rule: string|string[]): CSSStyleSheet {
  const sheet = new CSSStyleSheet();

  if (Array.isArray(rule)) {
    rule.forEach((r, i) => sheet.insertRule(r, i));
  } else {
    sheet.insertRule(rule, 0);
  }

  return sheet;
}

function generateStyleSheets(sheets: StyleSheet[]): Promise<CSSStyleSheet> {
  return Promise.all(sheets.map(sheet => {
    return sheet instanceof CSSResult ? sheet.generate() : Promise.resolve(sheet);
  }));
}

describe('css', () => {
  it('#css()', () => {
    const res = css`.red { color: ${'red'}; } div { top: ${100}px; }`;

    assert.instanceOf(res, CSSResult);
    assert.equal(res.cssText, '.red { color: red; } div { top: 100px; }');
  });

  //TODO actually test if styles are applied
  describe('#adoptStyleSheets()', () => {
    afterEach(resetAdoptingStyleSheets);

    it('with shadow', async () => {
      const styleSheets = [
        css`.blue { color: blue; }`,
        css`div { padding: 1em 0.5em; }`,
        createStyleSheet('span.icon { font-size: 1.2em; }'),
      ];

      const $div = document.createElement('div');
      const $shadow = $div.attachShadow({ mode: 'open' });
      const res = await adoptStyleSheets($shadow, 'span', styleSheets);
      const styles = await generateStyleSheets(styleSheets);

      if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
        assert.isTrue(res);
        assert.deepEqual($shadow.adoptedStyleSheets, styles);
      } else {
        assert.isFalse(res);
        assert.deepEqual([ null, null, null ], styles);
      }
    });
    it('without adopt support', async () => {
      disableAdoptingStyleSheets();
      const styleSheets = [
        createStyleSheet('.blue { color: blue; }'),
        css`div { padding: 1em 0.5em; }`,
        css`span.icon { font-size: 1.2em; }`,
      ];

      const $span = document.createElement('span');
      const $shadow = $span.attachShadow({ mode: 'open' });
      const res = await adoptStyleSheets($shadow, 'span', styleSheets);

      if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
        assert.isEmpty($shadow.adoptedStyleSheets);
      } else {
        assert.notProperty($shadow, 'adoptedStyleSheets');
      }

      assert.isFalse(res);
    });
  });

  describe('class CSSResult', () => {
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

    describe('#generate()', () => {
      afterEach(resetAdoptingStyleSheets);

      it('with adopting shim', async () => {
        const res = new CSSResult(['.red { color: ', '; }'], ['red']);
        const style = await res.generate();

        if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
          assert.instanceOf(style, CSSStyleSheet);

          const { rules } = style;
          assert.equal(rules.length, 1);
          assert.equal(rules[0].cssText, '.red { color: red; }');
        } else {
          assert.isNull(style);
        }
      });
      it('without adopting shim', async () => {
        disableAdoptingStyleSheets();
        const res = new CSSResult(['.red { color: ', '; }'], ['red']);
        assert.isNull(await res.generate());
      });
      it('with invalid content', async () => {
        const res = new CSSResult([100, {}], ['foo']);
        const styles = await res.generate();

        if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
          assert.instanceOf(styles, CSSStyleSheet);
          assert.isEmpty(styles.rules);
        } else {
          assert.isNull(styles);
        }
      });

      it('lazy caching', async () => {
        const res = new CSSResult(['.align-', ' { text-align: ', '; }'], ['left', 'left']);
        const styles = await res.generate();

        if (SUPPORTS_ADOPTING_STYLE_SHEETS) {
          assert.instanceOf(styles, CSSStyleSheet);
        } else {
          assert.isNull(styles);
        }

        // Stylesheets should be singletons
        assert.equal(styles, await res.generate());
      });
    });
  });
});
