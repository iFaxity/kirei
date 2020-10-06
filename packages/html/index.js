if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/html.cjs.prod.js');
} else {
  module.exports = require('./dist/html.cjs.js');
}
