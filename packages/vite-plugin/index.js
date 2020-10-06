if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/vite-plugin.cjs.prod.js');
} else {
  module.exports = require('./dist/vite-plugin.cjs.js');
}
