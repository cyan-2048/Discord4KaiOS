import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
	plugins: [tsconfigPaths(), preact()],
});
