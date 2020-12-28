// @ts-nocheck
/// <reference types="cypress" />
import { html, render } from '@kirei/element/src/runtime/compiler';
import { ref } from '@kirei/element/src';

function renderTemplate(template) {
  // Clear content & append new node
  const node = document.createElement('div');
  node.id = 'app';

  cy.document().then(doc => {
    // TODO HMR, override options, then reflow all mounted elements
    // However element state cannot be saved this way.
    // if already defined then just override options
    doc.body.textContent = '';
    doc.body.appendChild(node);
    render(template, node);
  });
  return node;
}

describe('compiler', () => {
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
