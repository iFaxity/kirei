if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/html.prod.cjs');
} else {
  module.exports = require('./dist/html.cjs');
}
