const BABEL_OPTIONS = {
  presets: [
    ['@babel/preset-env', {
      exclude: [ '@babel/plugin-transform-regenerator' ],
    }]
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    ['istanbul', {
      exclude: [ 'cypress' ],
    }],
  ]
};

module.exports = {
  entry: `${__dirname}/main.js`,
  mode: 'development',
  stats: 'errors-only',
  //devtool: 'inline-source-map',
  output: {
    path: `${__dirname}/dist`,
    filename: 'bundle.js', 
  },
  devServer: {
    clientLogLevel: 'error',
    contentBase: `${__dirname}/public`,
    publicPath: '/',
    historyApiFallback: true,
    port: 3000,
    host: '0.0.0.0',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: BABEL_OPTIONS,
      },
    ],
  },
};
