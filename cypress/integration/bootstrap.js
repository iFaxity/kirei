/*describe('End-to-end', () => {
  const mods = require.context('./e2e', true);
  mods.keys().forEach(mods);
});*/
describe('@kirei/element', () => {
  const mods = require.context('./element', true);
  mods.keys().forEach(mods);
});
describe('@kirei/html', () => {
  const mods = require.context('./html', true);
  mods.keys().forEach(mods);
});
/*describe('@kirei/router', () => {
  const mods = require.context('./router', true);
  mods.keys().forEach(mods);
});*/
describe('@kirei/shared', () => {
  const mods = require.context('./shared', true);
  mods.keys().forEach(mods);
});
/*describe('@kirei/ssr', () => {
  const mods = require.context('./ssr', true);
  mods.keys().forEach(mods);
});*/
