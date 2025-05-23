import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

import fs from "fs";
import { fileURLToPath, URL } from "url";

import solidSvg from "vite-plugin-solid-svg";
import zipPack from "vite-plugin-zip-pack";
import commonjs from "vite-plugin-commonjs";
import tsconfigPaths from "vite-tsconfig-paths";
import polyfillKaiOS, { polyfillKaiOSWorker } from "./scripts/vite";
import kaiManifest from "./scripts/manifest";
import { patchCssModules } from "vite-css-modules";

// import dotenv from "dotenv";
//
// dotenv.config();
// dotenv.config({ path: `.env.local`, override: true });

const isKai3 = process.env.KAIOS == "3";
const isCloudphone = process.env.CLOUDPHONE == "1";
const production = process.env.NODE_ENV === "production";

const manifest = JSON.parse(
	fs.readFileSync("./src/assets/" + (isKai3 ? "manifest.webmanifest" : "manifest.webapp"), "utf8")
);

function codeReplacer(src: string, codes: Array<[string, string] | false | null | undefined>) {
	for (let i = 0; i < codes.length; i++) {
		const item = codes[i];
		if (!item) continue;
		const codeToReplace = item[0];
		const replacement = item[1];

		if (src.includes(codeToReplace)) {
			return {
				code: src.replace(codeToReplace, replacement),
				map: null,
			};
		}
	}
}

const replaceFaultyCode = () => ({
	name: "add-window-worker",

	transform(src: string) {
		return codeReplacer(src, [
			[`...[_unused, type]`, `_unused, type`],
			[`...[store, options]`, `store, options`],
			[
				`input > 2n ** 32n || input < -(2n ** 32n)`,
				`input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))`,
			],
			!isKai3 &&
				production && [
					"/[\\n\\r\\p{Z}\\p{P}]+/u",
					"/[\\n\\r -#%-*,-/:;?@[-\\]_{}\\u00A0\\u00A1\\u00A7\\u00AB\\u00B6\\u00B7\\u00BB\\u00BF\\u037E\\u0387\\u055A-\\u055F\\u0589\\u058A\\u05BE\\u05C0\\u05C3\\u05C6\\u05F3\\u05F4\\u0609\\u060A\\u060C\\u060D\\u061B\\u061E\\u061F\\u066A-\\u066D\\u06D4\\u0700-\\u070D\\u07F7-\\u07F9\\u0830-\\u083E\\u085E\\u0964\\u0965\\u0970\\u09FD\\u0A76\\u0AF0\\u0C77\\u0C84\\u0DF4\\u0E4F\\u0E5A\\u0E5B\\u0F04-\\u0F12\\u0F14\\u0F3A-\\u0F3D\\u0F85\\u0FD0-\\u0FD4\\u0FD9\\u0FDA\\u104A-\\u104F\\u10FB\\u1360-\\u1368\\u1400\\u166E\\u1680\\u169B\\u169C\\u16EB-\\u16ED\\u1735\\u1736\\u17D4-\\u17D6\\u17D8-\\u17DA\\u1800-\\u180A\\u1944\\u1945\\u1A1E\\u1A1F\\u1AA0-\\u1AA6\\u1AA8-\\u1AAD\\u1B5A-\\u1B60\\u1BFC-\\u1BFF\\u1C3B-\\u1C3F\\u1C7E\\u1C7F\\u1CC0-\\u1CC7\\u1CD3\\u2000-\\u200A\\u2010-\\u2029\\u202F-\\u2043\\u2045-\\u2051\\u2053-\\u205F\\u207D\\u207E\\u208D\\u208E\\u2308-\\u230B\\u2329\\u232A\\u2768-\\u2775\\u27C5\\u27C6\\u27E6-\\u27EF\\u2983-\\u2998\\u29D8-\\u29DB\\u29FC\\u29FD\\u2CF9-\\u2CFC\\u2CFE\\u2CFF\\u2D70\\u2E00-\\u2E2E\\u2E30-\\u2E4F\\u3000-\\u3003\\u3008-\\u3011\\u3014-\\u301F\\u3030\\u303D\\u30A0\\u30FB\\uA4FE\\uA4FF\\uA60D-\\uA60F\\uA673\\uA67E\\uA6F2-\\uA6F7\\uA874-\\uA877\\uA8CE\\uA8CF\\uA8F8-\\uA8FA\\uA8FC\\uA92E\\uA92F\\uA95F\\uA9C1-\\uA9CD\\uA9DE\\uA9DF\\uAA5C-\\uAA5F\\uAADE\\uAADF\\uAAF0\\uAAF1\\uABEB\\uFD3E\\uFD3F\\uFE10-\\uFE19\\uFE30-\\uFE52\\uFE54-\\uFE61\\uFE63\\uFE68\\uFE6A\\uFE6B\\uFF01-\\uFF03\\uFF05-\\uFF0A\\uFF0C-\\uFF0F\\uFF1A\\uFF1B\\uFF1F\\uFF20\\uFF3B-\\uFF3D\\uFF3F\\uFF5B\\uFF5D\\uFF5F-\\uFF65]+/u",
				],
		]);
	},
});

export default defineConfig({
	plugins: [
		isKai3 && {
			name: "native-bigint",

			load(id) {
				if (id.endsWith("BigInteger.ts")) {
					const code = fs.readFileSync(id.replace(/BigInteger.ts$/, "NativeBigInteger.ts"), "utf-8");
					return { code, map: null };
				}
			},
		},

		patchCssModules({
			exportMode: "named",
			generateSourceTypes: true,
		}),
		solid(),
		solidSvg({
			defaultAsComponent: true,
			svgo: {
				enabled: false,
			},
		}),
		commonjs({
			dynamic: {
				loose: false,
			},
		}),
		tsconfigPaths(),
		polyfillKaiOS(),
		kaiManifest({
			isKai3,
			manifest,
		}),
		!isCloudphone &&
			zipPack({
				inDir: isKai3 ? "dist-v3" : "dist",
				outDir: "builds",
				outFileName: isKai3 ? "kori4kai3.zip" : "kori4kai2.zip",
			}),
		replaceFaultyCode(),
	],

	esbuild: {
		treeShaking: true,
	},

	server: {
		port: 3000,
	},

	resolve: {
		alias: [
			{ find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
			{
				find: "discord",
				replacement: fileURLToPath(new URL("./discord/", import.meta.url)),
			},
		],
	},

	css: {
		modules: {
			localsConvention: "camelCase",
		},
		preprocessorOptions: {
			scss: {
				additionalData: `$cloudphone: ${isCloudphone};`,
			},
		},
	},

	build: {
		outDir: isKai3 ? "dist-v3" : "dist",
		target: isKai3 ? "es2020" : "es6",
		cssTarget: isKai3 ? "firefox84" : "firefox48",
		cssCodeSplit: false,
		modulePreload: false,
		reportCompressedSize: false,
		assetsInlineLimit: (file) => {
			// this isn't an issue with KaiOS
			// the image will load properly it seems
			if (isCloudphone) {
				if (file.endsWith("icon112.png")) return true;
			}

			return false;
		},
		minify: "terser",
		cssMinify: true,
		ssr: false,
		sourcemap: false,

		rollupOptions: {
			output: {
				format: isKai3 ? "esm" : "systemjs",
				assetFileNames(chunkInfo) {
					const name = chunkInfo.names[0];

					if (name == "icon112.png") return name;

					return "assets/[name]-[hash][extname]";
				},
			},
		},
	},

	define: {
		"import.meta.env.KAIOS": isKai3 ? 3 : 2,
		// if it's dev mode always assume cloudphone support is necessary
		// I do not have plans to add dev:* another command
		"import.meta.env.CLOUDPHONE": !production || isCloudphone,
		"import.meta.env.DEV": !production,
		"import.meta.env.PROD": production,
		"import.meta.env.VITE_DEBUG_URL": JSON.stringify(process.env.VITE_DEBUG_URL || ""),
		"import.meta.env.MANIFEST": JSON.stringify(manifest),
		"import.meta.env.APP_VERSION": JSON.stringify(isKai3 ? manifest.b2g_features.version : manifest.version),
	},

	worker: {
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
			},
		},
		plugins: () => [polyfillKaiOSWorker(), replaceFaultyCode(), commonjs()],
	},
});
