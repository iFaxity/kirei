if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/babel-plugin-kirei.prod.cjs');
} else {
  module.exports = require('./dist/babel-plugin-kirei.cjs');
}
