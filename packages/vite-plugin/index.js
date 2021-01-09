if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/vite-plugin.prod.cjs');
} else {
  module.exports = require('./dist/vite-plugin.cjs');
}
