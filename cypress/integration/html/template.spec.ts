// @ts-nocheck
/// <reference types="cypress" />
import { Template, createCache } from '@kirei/html/template';

function template(type) {
  return (strings, ...values) => new Template(type, strings, values);
}

function mountTemplate(tpl, cache, compiler) {
  cache = cache ?? createCache();
  const node = tpl.update(cache, compiler).valueOf();

  // Clear content & append new node
  cy.document().then(doc => {
    doc.body.textContent = '';
    doc.body.appendChild(node);
  });

  return [ node, cache ];
}

describe('template', () => {
  it('#createCache()', () => {
    const cache = createCache();
    assert.isEmpty(cache.stack);
    assert.isNull(cache.instance);
    assert.isNull(cache.node);
  });

  // simple testing for the template class
  describe('class Template', () => {
    describe('with html type', () => {
      const html = template('html');

      it('#constructor()', () => {
        const tpl = html`<button>Clicks: ${100}</button>`;
        assert.equal(tpl.type, 'html');
        assert.deepEqual(tpl.strings, ['<button>Clicks: ', '</button>']);
        assert.deepEqual(tpl.values, [ 100 ]);
      });

      describe('#update()', () => {
        it('without interpolation', () => {
          const tpl = html`<p>Some text</p>`;
          const cache = createCache();
          const node = tpl.update(cache);

          assert.equal(node, cache.node);
          assert.deepEqual(cache.instance.strings, [ '<p>Some text</p>' ]);
          assert.equal(cache.instance.type, 'html');
          assert.instanceOf(cache.instance.root, DocumentFragment);
          assert.isEmpty(cache.instance.patchers);
        });
        it('with attr interpolation', () => {
          const tpl = html`<input type="text" value=${100} />`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get(node).should('have.attr', 'value', '100');
        });
        it('with prop interpolation', () => {
          const tpl = html`<span .className=${'hello world'}></span>`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get(node).should('have.prop', 'className', 'hello world');
        });
        it('with event interpolation', () => {
          function onClick(e) {
            e.target.textContent = 'Clicked!';
          }

          const tpl = html`<button @click=${onClick}>Click me!</button>`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get(node).click().should('have.text', 'Clicked!');
        });
        it('with node interpolation', () => {
          const tpl = html`<div>${html`<p>Some content</p>`}</div>`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get(node).should('contain.html', '<p>Some content</p>');
        });
        it('with text interpolation', () => {
          const tpl = html`<textarea>${'Type here!'}</textarea>`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get(node).should('have.text', 'Type here!');
        });
        it('with mixed interpolations', () => {
          function onInput(e) {
            e.target.className = e.target.value;
          }

          const tpl = html`
            <span>Normal text</span>
            <input @input=${onInput} value=${'Type here'} />
            ${html`<p>Some text</p>`}
            <textarea .id=${'text'}>${'Type here!'}</textarea>
          `;

          mountTemplate(tpl);
          cy.get('span').should('have.text', 'Normal text');
          cy.get('input')
            .should('have.attr', 'value', 'Type here')
            .clear().type('success')
            .should('have.attr', 'class', 'success');
          cy.get('p').should('have.text', 'Some text');
          cy.get('#text').should('have.text', 'Type here!');
        });
      });
    });

    describe('with svg type', () => {
      const svg = template('svg');

      it('#constructor()', () => {
        const tpl = svg`<circle r=${30} cx=${100} />`;
        assert.equal(tpl.type, 'svg');
        assert.deepEqual(tpl.strings, ['<circle r=', ' cx=', ' />']);
        assert.deepEqual(tpl.values, [ 30, 100 ]);
      });

      describe('#update()', () => {
        it('without interpolation', () => {
          const tpl = svg`<circle r="100"></circle>`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.deepEqual(cache.instance.strings, [ '<circle r="100"></circle>' ]);
          assert.equal(cache.instance.type, 'svg');
          assert.instanceOf(cache.instance.root, DocumentFragment);
          assert.isEmpty(cache.instance.patchers);
          cy.get(node).should('have.attr', 'r', '100');
        });
        it('with attr interpolation', () => {
          const tpl = svg`<rect x=${11} y="1" width="8" height="8" />`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get(node).should('have.attr', 'x', '11');
        });
        it('with prop interpolation', () => {
          const tpl = svg`<circle .id=${'active'} />`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get(node).should('have.prop', 'id', 'active');
        });
        it('with event interpolation', () => {
          function onClick(e) {
            e.target.textContent = 'Clicked!';
          }

          const tpl = svg`<svg>
            <rect width="50" height="50" @click=${onClick}>Click me!</rect>
          </svg>`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get('rect').click().should('have.text', 'Clicked!');
        });
        it('with node interpolation', () => {
          const tpl = svg`<text>Hello, ${svg`<a href="#link">click me</a>`}</text>`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get(node).should('contain.html', 'Hello, <a href="#link">click me</a>');
        });
        it('with text interpolation', () => {
          const tpl = svg`<style>${'color: red'}</style>`;
          const [ node, cache ] = mountTemplate(tpl);

          assert.equal(node, cache.node);
          assert.isNotEmpty(cache.instance.patchers);
          cy.get(node).should('have.text', 'color: red');
        });
        it('with mixed interpolations', () => {
          function onMouseUp(e) {
            e.target.stroke = 'black';
          }

          const tpl = svg`
            <circle r=${100} />
            <svg>
              <rect width="100" height="100" .stroke=${'red'} @mouseup=${onMouseUp} />
            </svg>
            ${svg`<text>Foo bar</text>`}
            <style>${'color: green'}</style>
          `;
          mountTemplate(tpl);

          cy.get('circle').should('have.attr', 'r', '100');
          cy.get('rect')
            .should('have.prop', 'stroke', 'red')
            .click()
            .should('have.prop', 'stroke', 'black');
          cy.get('text').should('have.text', 'Foo bar');
          cy.get('style').should('have.text', 'color: green');
        });
      });
    });
  });
});
