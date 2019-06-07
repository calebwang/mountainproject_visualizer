const webpack = require("webpack");
const resolve = require("path").resolve;


module.exports = {
  entry: __dirname + "/src/visualize.js",
  output: {
    path: resolve("./static/build"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js?/,  
        exclude: /node_modules/,
        use: "babel-loader"
      }
    ]
  }
}
