const { LibManifestPlugin } = require("webpack");
const path = require('path');

module.exports = {
  entry: "./animation-demo.js",
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
              presets: ["@babel/preset-env"],
              plugins: [["@babel/plugin-transform-react-jsx", {pragma:"createElement"}]]
          }
        }
      }
    ]
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port:9000
  },
  mode: "development"
};
