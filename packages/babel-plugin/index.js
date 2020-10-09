if (process.env.NODE_ENV == 'production') {
  module.exports = require('./dist/babel-plugin-kirei.cjs.prod.js');
} else {
  module.exports = require('./dist/babel-plugin-kirei.cjs.js');
}
