// vite will only be used on development builds
// i can't figure out how to setup the production builds
// it seems like esbuild isn't too good at transpiling

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		port: 3000,
	},
	define: {
		PRODUCTION: "false",
	},
	plugins: [
		svelte({
			compilerOptions: {
				cssHash({ hash, css, name, filename }) {
					return `${name}-${hash(filename)}`;
				},
			},
			preprocess: sveltePreprocess(),
			onwarn(warning, handler) {
				if (warning.code.startsWith("a11y-")) {
					return;
				}
				handler(warning);
			},
		}),
	],
});
