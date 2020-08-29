/// <reference types="cypress" />
import { directive, directives, html, render } from '@kirei/element/dist/compiler';
import { ref } from '@kirei/fx';

function renderTemplate(template) {
  // Clear content & append new node
  const node = document.createElement('div');
  node.id = 'app';

  cy.document().then(doc => {
    doc.body.textContent = '';
    doc.body.appendChild(node);
    render(template, node);
  });
  return node;
}

const denyDirectives = [...directives.keys()];

describe('compiler', () => {
  // Ensure only standard directives are loaded
  afterEach(() => {
    const directiveKeys = [...directives.keys()];
    for (const key of directiveKeys.filter(x => !denyDirectives.includes(x))) {
      directives.delete(key);
    }
  });

  describe('#directive()', () => {
    it('define directive', () => {
      const fn = () => {};
      assert.doesNotThrow(() => directive('text', fn));
    });
    it('alias named', () => {
      const fn = () => {};
      assert.doesNotThrow(() => directive('?', fn));
    });
    it('invalid name', () => {
      const fn = () => {};
      assert.throws(() => directive(100, fn));
      assert.throws(() => directive(null, fn));
      assert.throws(() => directive([], fn));
    });
    it('prevent overwriting', () => {
      directive('x-item', () => {});
      assert.throws(() => directive('x-item', () => {}));
    });
    it('invalid directive', () => {
      assert.throws(() => directive('hello', {}));
      assert.throws(() => directive('world', null));
      assert.throws(() => directive('foo', true));
      assert.throws(() => directive(100, () => {}));
    });
  });

  describe('#compiler.attr()', () => {
    it('implicit unref', () => {
      const r = ref('active text')
      const node = renderTemplate(html`
        <p class=${r}></p>
      `);

      cy.get(node).children().first()
        .should('have.attr', 'class', 'active text');
    });
    it('explicit unref', () => {
      const r = ref(true);
      const node = renderTemplate(html`
        <div>Ref is ${r.value}</div>
      `);

      cy.get(node).children().first()
        .should('have.text', 'Ref is true');
    });

    it('with directive', () => {
      directive('x-test', dir => {
        assert.equal(dir.name, 'x-test');
        return (pending) => {
          dir.el.textContent = pending;
        };
      });

      const r = ref('Im some content');
      const node = renderTemplate(html`
        <div x-test=${r}></div>
      `);

      cy.get(node).children().first()
        .should('have.text', 'Im some content');
    });

    it('with directive alias', () => {
      directive('%', dir => {
        assert.equal(dir.name, '%');
        return (pending) => {
          dir.el.setAttribute('data-test', pending);
        };
      });

      const r = ref('Im an attribute');
      const node = renderTemplate(html`
        <p %=${r}></p>
      `);

      cy.get(node).children().first()
        .should('have.attr', 'data-test', 'Im an attribute');
    });
  });

  describe('#compiler.node()', () => {
    it('implicit unref', () => {
      const r1 = ref(99);
      const r2 = ref('Red Balloons');
      const node = renderTemplate(html`
        <p>${r1} ${r2}</p>
      `);

      cy.get(node).children().first()
        .should('have.text', '99 Red Balloons');
    });
    it('explicit unref', () => {
      const r = ref(true);
      const node = renderTemplate(html`
        <div>Ref is ${r.value}</div>
      `);

      cy.get(node).children().first()
        .should('have.text', 'Ref is true');
    });
  });

  describe('#compiler.text()', () => {
    it('implicit unref', () => {
      const r = ref('hello');
      const node = renderTemplate(html`
        <style>${r}</style>
      `);

      cy.get(node)
        .first()
        .should('have.text', 'hello');
    });
    it('explicit unref', () => {
      const r = ref('world!');
      const node = renderTemplate(html`
        <textarea>${r.value}</textarea>
      `);

      cy.get(node)
        .first()
        .should('have.text', 'world!');
    });
  });
});
