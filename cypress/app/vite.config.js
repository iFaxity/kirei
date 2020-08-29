// vite.config.js
const kirei = require('@kirei/vite-plugin');
const istanbul = require('vite-plugin-istanbul');
const include = [ 'elements/', 'views/' ];

module.exports = {
  open: true,
  port: 3000,
  plugins: [ kirei({ include, cwd: __dirname }), istanbul({ exclude: [ 'cypress' ] }), ],
};
