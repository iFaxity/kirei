// @ts-nocheck
/// <reference types="cypress" />
import { Template, customize, html, svg, render } from '@kirei/html/src';

describe('#customize()', () => {
  it('without options', () => {
    const res = customize();

    assert.isFunction(res.render);
    assert.isFunction(res.html);
    assert.isFunction(res.svg);
  });
  it('with custom literals', () => {
    const fn = () => {};
    const { html, svg } = customize({
      literals: { fn },
    });

    assert.isFunction(html.fn);
    assert.isFunction(svg.fn);
    assert.equal(html.fn, fn);
    assert.equal(svg.fn, fn);
  });
  it('prevent overriding defined literals', () => {
    const key = () => {};
    assert.throws(() => customize({ literals: { key } }));
  });
  it('with custom compiler', () => {});

  describe('#render()', () => {
    it('with template', () => {
      const root = document.createElement('div');
      const tpl = html`<p><strong>Hello</strong> there!</p>`;
      render(tpl, root);

      assert.equal(root.childNodes.length, 1);
      assert.equal((root.firstChild as Element).tagName, 'P');
    });
    it('with node', () => {
      const root = document.createElement('div');
      const node = document.createElement('p');
      render(node, root);

      assert.equal(root.childNodes.length, 1);
      assert.equal(root.firstChild, node);
    });
    it('with invalid template', () => {
      const root = document.createElement('div');
      assert.throws(() => render('hello' as any, root));
    });
    it('cleanup root', () => {
      const root = document.createElement('div');
      const node = document.createElement('p');

      render(node, root);
      assert.equal(root.childNodes.length, 1);
      assert.equal(root.firstChild, node);

      render(null, root);
      assert.equal(root.childNodes.length, 0);
    });
  });

  describe('#html()', () => {
    it('construct template', () => {
      const name = 'user';
      const website = 'Kirei';
      const tpl = html`<p>Hello ${name}! Welcome to ${website}.</p>`;

      assert.instanceOf(tpl, Template);
      assert.equal(tpl.type, 'html');
      assert.equal(tpl.values.length, 2);
      assert.deepEqual(tpl.values, [ name, website ]);
      assert.equal(tpl.strings.length, 3);
      assert.deepEqual(tpl.strings, ['<p>Hello ', '! Welcome to ', '.</p>'] as any);
    });

    describe('#key()', () => {
      it('basic usage', () => {
        const node = html.key({}, html`<p>Keyed node</p>`);
        assert.instanceOf(node, Node)
      });
      it('validate cache', () => {
        const o = {};
        const node = html.key(o, html`<p>Keyed node</p>`);
        assert.instanceOf(node, Node)

        const cached = html.key(o, html`<p>Keyed node</p>`);
        assert.instanceOf(cached, Node);
        assert.equal(cached, node);
      });
    });
  });

  describe('#svg()', () => {
    it('construct template', () => {
      const stroke = 'green';
      const radius = 100;
      const tpl = svg`<circle stroke=${stroke} r=${radius} />`;

      assert.instanceOf(tpl, Template);
      assert.equal(tpl.type, 'svg');
      assert.equal(tpl.values.length, 2);
      assert.deepEqual(tpl.values, [ stroke, radius ]);
      assert.equal(tpl.strings.length, 3);
      assert.deepEqual(tpl.strings, ['<circle stroke=', ' r=', ' />'] as any);
    });

    describe('#key()', () => {
      it('basic usage', () => {
        const node = svg.key({}, svg`<rect width="100" height="100" />`);
        assert.instanceOf(node, Node);
      });
      it('validate cache', () => {
        const o = {};
        const node = svg.key(o, svg`<rect width="100" height="100" />`);
        assert.instanceOf(node, Node);

        const cached = svg.key(o, svg`<rect width="100" height="100" />`);
        assert.instanceOf(cached, Node);
        assert.equal(cached, node);
      });
    });
  });
});
