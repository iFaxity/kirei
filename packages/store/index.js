if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/store.prod.cjs');
} else {
  module.exports = require('./dist/store.cjs');
}
