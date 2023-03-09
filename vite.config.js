import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
	server: {
		port: 3210,
	},
	define: {
		PRODUCTION: "false",
	},
	esbuildOptions: {
		alias: {
			react: "preact/compat",
		},
	},
	plugins: [preact()],
});
