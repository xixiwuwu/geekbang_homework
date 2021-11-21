const webpack = require('webpack'); //to access built-in plugins
const VueLoaderPlugin = require("vue-loader/lib/plugin");
module.exports = {
    entry: "./src/main.js",
    module: {
    rules: [{ test: /\.vue$/, use: 'vue-loader' }],
  },
  plugins: [
      new VueLoaderPlugin()
    ],
};