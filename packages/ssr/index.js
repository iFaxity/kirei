if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/ssr.cjs.prod.js');
} else {
  module.exports = require('./dist/ssr.cjs.js');
}
