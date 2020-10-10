// @ts-nocheck
/// <reference types="cypress" />

it('visit main page', () => {
  cy.visit('')
    .get('app-root')
    .should('have.attr', 'name', 'Kirei dev server');
});
