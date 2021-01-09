if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/router.prod.cjs');
} else {
  module.exports = require('./dist/router.cjs');
}
