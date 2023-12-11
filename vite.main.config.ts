import { defineConfig } from "vite";
import commonjs from "@rollup/plugin-commonjs";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    browserField: false,
    mainFields: ["module", "jsnext:main", "jsnext"],
  },
  plugins: [
    commonjs({
      dynamicRequireTargets: ["!node_modules/@nut-tree/libnut-linux/build/Release/libnut.node",],
    }),
  ],
});
