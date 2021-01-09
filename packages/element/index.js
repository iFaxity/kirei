if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/element.prod.cjs');
} else {
  module.exports = require('./dist/element.cjs');
}
