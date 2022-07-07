import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import FullReload from "vite-plugin-full-reload";
import cors_proxy from "cors-anywhere";

// proxy when using dev build
// on kaios we can just use xmlhttpreq with mozSystem
cors_proxy
	.createServer({
		originWhitelist: [], // Allow all origins
		requireHeader: [],
		removeHeaders: [],
	})
	.listen(6969, "0.0.0.0");

// https://vitejs.dev/config/
export default defineConfig({
	define: {
		PRODUCTION: JSON.stringify(false),
	},
	plugins: [FullReload(["src/**/*"]), svelte()],
});
