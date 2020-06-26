module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              context: __dirname,
            }
          }
        ],
      },
      {
        test: /\.(ts|js)$/,
        exclude: /node_modules/,
        enforce: 'post',
        use: [
          {
            loader: 'istanbul-instrumenter-loader',
            options: { esModules: true },
          }
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
};
