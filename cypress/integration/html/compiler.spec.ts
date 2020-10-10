// @ts-nocheck
/// <reference types="cypress" />
import { defaultCompiler } from '@kirei/html/src';

function assertText(value, expected) {
  const node = document.createComment('');
  const patcher = defaultCompiler.text(node);

  patcher(value);
  assert.equal(node.textContent, expected);
}

function assertAttr(name, value, expected) {
  const node = document.createElement('div');
  const patcher = defaultCompiler.attr(node, name);

  patcher(value);

  // NOTE: @event not tested for, not possible to detect event listeners in DOM
  if (name[0] == '.') {
    const prop = name.slice(1);
    assert.equal(node[prop], expected);
  } else if (expected == null) {
    assert(!node.hasAttribute(name));
  } else {
    assert(node.hasAttribute(name));
    assert.equal(node.getAttribute(name), expected);
  }
}

function assertNode(value, expected) {
  const el = document.createElement('div');
  const node = document.createComment('');
  const patcher = defaultCompiler.node(node);
  el.appendChild(node); // refnode needs to be in el

  patcher(value);
  // if expected == string, check if only one child node, as text node, and check text
  if (!Array.isArray(expected)) {
    assert.equal(el.childNodes.length, 2);
    assert.equal(el.firstChild.textContent, expected);
  } else {
    assert.equal(el.childNodes.length - 1, expected.length);

    for (let i = 0; i < expected.length; i++) {
      assert.equal(el.childNodes[i], expected[i]);
    }
    assert.equal(el.lastChild, node);
  }
}

describe('compiler', () => {
  describe('#defaultCompiler', () => {
    describe('#text()', () => {
      it('with string', () => assertText('Hello', 'Hello'));
      it('with boolean', () => assertText(false, 'false'));
      it('with null', () => assertText(null, ''));
      it('with undefined', () => assertText(void 0, ''));
      it('with object', () => assertText({}, '[object Object]'));
    });

    describe('#attr()', () => {
      it('with string', () => assertAttr('id', 'FooBar', 'FooBar'));
      it('with number', () => assertAttr('id', 100, '100'));
      it('with array', () => assertAttr('id', ['First', 'Second', 'Third'], 'First,Second,Third'));
      it('with object', () => assertAttr('id', { foo: true, bar: false, baz: -1 }, '[object Object]'));
      it('with null', () => assertAttr('id', null, null));
      it('mount, then unmount', () => {
        const node = document.createElement('div');
        const patcher = defaultCompiler.attr(node, 'id');

        patcher('Test');
        assert.equal(node.getAttribute('id'), 'Test');

        patcher(null);
        assert(!node.hasAttribute('id'));
      });

      describe('map style', () => {
        it('with string', () => assertAttr('style', 'hi', 'hi'));
        it('with number', () => assertAttr('style', 50, '50'));
        it('with null', () => assertAttr('style', null, null));
        it('with object', () => assertAttr('style', {
          kirei: true,
          looks: 100,
          bad: '',
          good: 'yes',
        }, 'kirei=true;looks=100;good=yes'));
        it('with array', () => {
          const node = document.createElement('div');
          const patcher = defaultCompiler.attr(node, 'style');
          assert.throws(() => patcher(['hello', false, 100]));
        });
      });

      describe('map class', () => {
        it('with string', () => assertAttr('class', 'hi', 'hi'));
        it('with number', () => assertAttr('class', 7, '7'));
        it('with null', () => assertAttr('class', null, null));
        it('with object', () => assertAttr('class', {
          foo: true,
          bar: 0,
          baz: 'hello',
        }, 'foo baz'));
        it('with array', () => assertAttr('class', [
          'hello',
          true,
          'world',
        ], 'hello true world'));
      });

      describe('with prop patcher', () => {
        it('with string', () => assertAttr('.title', 'click', 'click'));
        it('with number', () => assertAttr('.tabIndex', 10, 10));
        it('with null', () => assertAttr('.id', null, 'null'));
        it('with undefined', () => assertAttr('.className', void 0, 'undefined'));
      });
    });

    describe('#node()', () => {
      it('with string', () => assertNode('Hello', 'Hello'));
      it('with number', () => assertNode(989, '989'));
      it('with boolean', () => assertNode(true, 'true'));
      it('with null', () => assertNode(null, []));
      it('with node', () => {
        const node = document.createElement('span');
        assertNode(node, [ node ]);
      });
      it('with element list', () => {
        const nodes = [
          document.createElement('div'),
          document.createElement('p'),
          document.createElement('blockquote'),
          document.createElement('p'),
        ];
        assertNode(nodes, nodes);
      });
      it('with DocFragment', () => {
        const frag = document.createDocumentFragment();
        const nodes = [
          document.createElement('ul'),
          document.createElement('div'),
          document.createElement('p'),
        ];
        nodes.forEach(n => frag.appendChild(n));

        assertNode(frag, nodes);
      });
      it('with object', () => assert.throws(() => assertNode({}, [])));
    });
  });
});
