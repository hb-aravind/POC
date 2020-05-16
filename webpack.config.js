const nodeExternals = require('webpack-node-externals');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const path = require('path');

module.exports = {
  target: 'node',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.bundle.js',
  },
  node: {
    // Need this when working with express, otherwise the build fails
    __dirname: false, // if you don't put this is, __dirname
    __filename: false, // and __filename return blank or /
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                targets: {
                  node: '8.10',
                },
              },
            ],
          ],
          plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-object-rest-spread']
        },
      },
    ],
  },
  resolveLoader: {
    modules: [`${__dirname}/node_modules`],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin([{ from: 'app/views', to: 'views' }, { from: 'app/public', to: 'public' }]),
  ],
};
