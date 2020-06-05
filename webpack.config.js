/**
 * webpack.development.js
 * 
 * What it Does:
 *   Webpack bundles up your application for the browser.
 *   This file tells webpack what to do when you want
 *   a development server to be created. This file sets up automatic reload
 *   as well as putting the configuration options into process.env to be
 *   picked up by the react app.
 * 
 * Things to Edit:
 *   Be careful when editing webpack configuration as it gets confusing
 *   quickly. If you want to make any changes to how your app is being
 *   rendered in development then this is the place to look. Things like
 *   transpiling a new file type or adding a webpack plugin can be done
 *   here.
 */

var path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  watch: false,
  entry: './handler.js',
  output: {
    path: path.resolve(__dirname, './dist/'),
    filename: 'bundle.js'
  },
//   optimization: {
//     minimize: false,
//   },
  module: {
    rules: [
        {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: ['react']
                }
              }
            ],
        }
        ,
        {
            // Preprocess our own .css files
            test: /\.css$/,
            exclude: /node_modules/,
            use: [
                MiniCssExtractPlugin.loader, // instead of style-loader
                'css-loader'
            ]
        }  
    ]
  },
  devServer: {
    compress: true,
    // contentBase: path.resolve(__dirname, '.'),
    port: process.env['frontendPort'],
    host: '0.0.0.0',
    disableHostCheck: true,
    overlay: true,
    hot: true,
    inline: true,
    watchOptions: {
      poll: true
    }
  },
  plugins: [
    new webpack.EnvironmentPlugin({
        projectUUID: "playcent-project-uuid",
        dbDomain: "http://playcent.com"
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: './index.html',
    //   chunks: ['handler']
    }),
    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
    }),
    new MiniCssExtractPlugin(),

  ],
  resolve: {
    extensions: ['.js', '.jsx', '.react.js'],
  },

};
