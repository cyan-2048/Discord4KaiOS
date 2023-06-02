import esbuild from "esbuild";
import fs from "fs";

/**
 * @type {string}
 */
const polyfillSrc = fs.readFileSync(`${__dirname}/polyfills.js`, "utf-8");

const polyfillScript =
	esbuild.transformSync(polyfillSrc, {
		minify: true,
		target: "es6",
		format: "iife",
	})?.code || "";

// the plugin should only work if you're building for KaiOS
const production = process.env.NODE_ENV === "production";

/**
 *
 * @returns {import("vite").Plugin | undefined}
 */
export default function polyfillKaiOS() {
	if (production)
		return {
			name: "polyfill-kai",

			transformIndexHtml(html) {
				return html.replace(/type="module" crossorigin/g, "defer");
			},

			generateBundle(options, bundle) {
				const regexp = /for((\s?)*)\(((\s?)*)const/g;
				for (const fileName in bundle) {
					if (fileName.endsWith(".js")) {
						const output = bundle[fileName];
						if (output && "code" in output) {
							const code = output.code.replace(regexp, "for(let ");
							if (!code) continue;
							output.code = polyfillScript + "\n" + code;
						}
					}
				}
			},
		};
}
