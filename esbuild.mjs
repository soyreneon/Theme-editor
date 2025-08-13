// const esbuild = require("esbuild");
import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");
import CssModulesPlugin from "esbuild-css-modules-plugin";

// copy codicons to media directory to be used in production webview
const codiconSrcDir = path.resolve("node_modules/@vscode/codicons/dist");
const codiconDestDir = path.resolve("media/codicons");

if (!fs.existsSync(codiconDestDir)) {
  fs.mkdirSync(codiconDestDir, { recursive: true });
}

["codicon.css", "codicon.ttf"].forEach((file) => {
  fs.copyFileSync(
    path.join(codiconSrcDir, file),
    path.join(codiconDestDir, file)
  );
});

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`
        );
      });
      console.log("[watch] build finished");
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: [
      "src/extension.ts",
      //"ui/src/index.tsx"
    ],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    mainFields: ["module", "main"],
    logLevel: "silent",
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });
  const ctxWeb = await esbuild.context({
    entryPoints: ["ui/index.tsx"],
    bundle: true,
    //format: "cjs",
    platform: "browser",
    format: "esm",
    outfile: "dist/ui/webview.js",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    plugins: [
      CssModulesPlugin({
        // @see https://github.com/indooorsman/esbuild-css-modules-plugin/blob/main/index.d.ts for more details
        force: true,
        emitDeclarationFile: true,
        localsConvention: "camelCaseOnly",
        namedExports: true,
        inject: false,
      }),
    ],
  });
  if (watch) {
    await ctx.watch();
    await ctxWeb.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    await ctxWeb.rebuild();
    await ctxWeb.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
