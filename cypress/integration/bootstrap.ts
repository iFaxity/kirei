/// <reference types="cypress" />

/*describe('End-to-end', () => {
  const mods = require.context('./e2e', true, /\.spec.ts$/);
  mods.keys().forEach(mods);
});*/
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
describe('@kirei/shared', () => {
  const mods = require.context('./shared', true, /\.spec.ts$/);
  mods.keys().forEach(mods);
});
/*describe('@kirei/ssr', () => {
  const mods = require.context('./ssr', true, /\.spec.ts$/);
  mods.keys().forEach(mods);
});*/


/*describe('End-to-end', importAll('./e2e'));
describe('babel-plugin-kirei', importAll('./babel-plugin'));
describe('@kirei/element', importAll('./element'));
describe('@kirei/hmr-api', importAll('./hmr-api'));
describe('@kirei/html', importAll('./html'));
describe('@kirei/router', importAll('./router'));
describe('@kirei/shared', importAll('./shared'));
describe('@kirei/store', importAll('./store'));
describe('@kirei/ssr', importAll('./ssr'));
describe('@kirei/vite-plugin', importAll('./vite-plugin'));*/
