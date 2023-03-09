#!/usr/bin/env node

const debug = process.env.debug === "true";
const kaios3 = process.env.kaios === "3";

import * as fs from "fs/promises";
import path from "path";

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

await fs.mkdir("./dist/build/", { recursive: true });
await Promise.all([fs.copyFile("./src/assets/manifest.json", "./dist/manifest.webapp")]);
await copyDirectory("./public", "./dist");

import esbuild from "esbuild";
import autoprefixer from "autoprefixer";
import hslFix from "postcss-color-hsl";

const outfile = "./dist/build/bundle.js";
const polyfills = await esbuild.transform(await fs.readFile("./scripts/polyfills.js", "utf-8"), {
	minify: true,
	target: "es6",
});

const options = {
	entryPoints: ["./src/main.js"],
	mainFields: ["browser", "module", "main"],
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
	plugins: [],
	alias: {
		react: "preact/compat",
	},
	write: false,
	// annoying CSS
	external: ["*.png", "*.ttf", "*.svg"],
};

try {
	const regexp = /for((\s?)*)\(((\s?)*)const/g;
	const build = await esbuild.build(options);

	build.outputFiles.forEach((file) => {
		let text = null;
		if (file.path.endsWith("bundle.js")) {
			text = file.text.replace(regexp, "for(let ");
		}
		fs.writeFile(file.path, text || file.contents);
	});
} catch (err) {
	console.error(err);
	process.exit(1);
}
