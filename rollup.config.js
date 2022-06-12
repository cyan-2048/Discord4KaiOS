import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";
import babel from "@rollup/plugin-babel";
import copy from "rollup-plugin-copy";
import json from "@rollup/plugin-json";

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;






	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require("child_process").spawn("npm", ["run", "start", "--", "--dev"], {
				stdio: ["ignore", "inherit", "inherit"],
				shell: true,
			});

			process.on("SIGTERM", toExit);
			process.on("exit", toExit);
		},
	};
}

export default {
	input: "src/main.js",
	output: {
		sourcemap: false,
		format: "iife",
		name: "app",
		file: `${production ? "dist" : "public"}/build/bundle.js`,
	},
	plugins: [
		production &&
			copy({
				targets: [{ src: "public/*", dest: "dist/" }],
			}),
		commonjs(),
		json(),
		svelte({
			compilerOptions: {
				// compiler checks makes the thing very slow
				dev: false,
			},
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: "bundle.css" }),

		production && // don't transpile on new browser, does not work properly
			babel({
				extensions: [".js", ".mjs", ".html", ".svelte"],
				babelHelpers: "runtime",
				exclude: ["node_modules/@babel/**", /\/core-js\//],
				presets: [
					[
						"@babel/preset-env",
						{
							targets: { firefox: "48" },
							useBuiltIns: "usage",
							corejs: 3,
						},
					],
				],
				plugins: [
					"@babel/plugin-syntax-dynamic-import",
					"babel-plugin-transform-async-to-promises",
					[
						"@babel/plugin-transform-runtime",
						{
							useESModules: true,
						},
					],
				],
			}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ["svelte"],
		}),
		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload("public"),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser(),
	],
	watch: {
		buildDelay: 5000,
		clearScreen: false,
	},
};
