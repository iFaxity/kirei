const DIST_DIR = __dirname + './dev/dist';

module.exports = {
  entry: {
    calc: './dev/calc.ts',
    bench: './dev/bench.ts',
    todo: './dev/todo.ts',
    index: './dev/index.ts',
  },
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    filename: '[name].js',
    path: DIST_DIR
  },
  devServer: {
    port: 3000,
    historyApiFallback: true,
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader'
        },
      },
      {
        test: /\.(html|png|svg|jpg|gif)$/,
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
