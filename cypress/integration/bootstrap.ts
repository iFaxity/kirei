/// <reference types="cypress" />

/*describe('End-to-end', () => {
  const mods = require.context('./e2e', true, /\.spec.ts$/);
  mods.keys().forEach(mods);
});*/

// Unit tests
describe('@kirei/element', () => {
  const mods = require.context('./element', true, /\.spec.ts$/);
  mods.keys().forEach(mods);
});
describe('@kirei/html', () => {
  const mods = require.context('./html', true, /\.spec.ts$/);
  mods.keys().forEach(mods);
});
/*describe('@kirei/router', () => {
  const mods = require.context('./router', true, /\.spec.ts$/);
  mods.keys().forEach(mods);
});*/
/*describe('@kirei/store', () => {
  const mods = require.context('./store', true, /\.spec.ts$/);
  mods.keys().forEach(mods);
});*/
describe('@kirei/shared', () => {
  const mods = require.context('./shared', true, /\.spec.ts$/);
  mods.keys().forEach(mods);
});
