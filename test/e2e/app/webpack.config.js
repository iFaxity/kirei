module.exports = {
  entry: './main.js',
  mode: 'development',
  output: {
    filename: '[name].js',
  },
  devServer: {
    port: 3000,
    historyApiFallback: true,
    host: '0.0.0.0',
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          { loader: 'ts-loader' },
          {
            loader: 'istanbul-instrumenter-loader',
            options: { esModules: true }
          },
        ],
      },
      {
        test: /\.html$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
          },
        },
      },
    ],
  },
};
