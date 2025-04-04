import type { Configuration } from "webpack";
import CopyWebpackPlugin from "copy-webpack-plugin";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/main.ts",
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
  },
};

// Add CopyWebpackPlugin to copy the assets folder to the output directory
plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: "assets", // source folder in project root
        to: "assets", // destination folder in output directory
        noErrorOnMissing: true,
      },
    ],
  })
);
