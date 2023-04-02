import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tsconfigPaths from "vite-tsconfig-paths";

import fs from "fs";
import path from "path";

const WRONG_CODE = `import { bpfrpt_proptype_WindowScroller } from "../WindowScroller.js";`;
export function reactVirtualized() {
	return {
		name: "my:react-virtualized",
		configResolved() {
			const file = require.resolve("react-virtualized").replace(path.join("dist", "commonjs", "index.js"), path.join("dist", "es", "WindowScroller", "utils", "onScroll.js"));
			const code = fs.readFileSync(file, "utf-8");
			const modified = code.replace(WRONG_CODE, "");
			fs.writeFileSync(file, modified);
		},
	};
}

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
	plugins: [tsconfigPaths(), preact(), reactVirtualized()],
});
