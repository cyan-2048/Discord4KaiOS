#!/usr/bin/env node

const debug = process.env.debug === "true";
const kaios3 = process.env.kaios === "3";

import * as fs from "fs/promises";
import path from "path";
const rootDir = path.resolve("./") + "/";

async function copyDirectory(src, dest) {
  const [entries] = await Promise.all([fs.readdir(src, { withFileTypes: true }), fs.mkdir(dest, { recursive: true })]);

  await Promise.all(
    entries.map((entry) => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      return entry.isDirectory() ? copyDirectory(srcPath, destPath) : fs.copyFile(srcPath, destPath);
    })
  );
}

await copyDirectory("./public", "./dist");
await Promise.all([
  fs.mkdir("./dist/build/", { recursive: true }),
  fs.copyFile("./src/assets/manifest.json", "./dist/manifest.webapp"),
]);

import esbuild from "esbuild";
import svelte from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";
import autoprefixer from "autoprefixer";
import hslFix from "postcss-color-hsl";

hslFix;

const outfile = "./dist/build/bundle.js";
const polyfills = await esbuild.transform(await fs.readFile("./scripts/polyfills.js", "utf-8"), {
  minify: true,
  target: "es6",
});

const options = {
  entryPoints: ["./src/main.js"],
  mainFields: ["svelte", "browser", "module", "main"],
  outfile,
  format: "iife",
  logLevel: "info",
  ignoreAnnotations: true,
  treeShaking: true,
  legalComments: "linked",
  banner: {
    js: polyfills?.code,
  },
  target: kaios3 ? "es2021" : "es6",
  minify: !debug,
  bundle: true,
  define: { PRODUCTION: true },
  sourcemap: "linked",
  supported: {
    "hex-rgba": false,
  },
  plugins: [
    svelte({
      cache: true,
      preprocess: sveltePreprocess({
        postcss: {
          plugins: [
            autoprefixer({
              overrideBrowserslist: "firefox 48",
            }),
            hslFix,
          ],
        },
      }),
      compilerOptions: {
        // compiler checks makes the thing very slow
        dev: false,
        cssHash({ hash, css, name, filename }) {
          return `s-${hash(filename)}`;
        },
      },
    }),
  ],
  // annoying CSS
  external: ["*.png", "*.ttf", "*.svg"],
};

try {
	await esbuild.build(options);
	const regexp = /for((\s?)*)\(((\s?)*)const/g;
	const text = await fs.readFile(outfile, "utf8");
	// on KaiOS aka Firefox48, for(const is broken
	await fs.writeFile(outfile, text.replace(regexp, "for(let "));
} catch (err) {
	console.error(err);
	process.exit(1);
}
