import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import FullReload from "vite-plugin-full-reload";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		FullReload(["src/main.js", "src/App.svelte", "src/components/Messages.svelte", "src/lib/shared.js"]),
		svelte(),
	],
});
