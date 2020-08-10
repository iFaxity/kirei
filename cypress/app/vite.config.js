// vite.config.js
const kirei = require('@kirei/vite-plugin');
const istanbul = require('vite-plugin-istanbul');
const include = [ 'app/elements/', 'app/views/' ];

module.exports = {
  open: true,
  port: 3000,
  plugins: [ kirei({ include }), istanbul({ exclude: [ 'cypress' ] }), ],
};
