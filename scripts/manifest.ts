import fs from "fs";
import { resolve } from "path";
import crypto from "crypto";
import { PluginOption, ResolvedConfig } from "vite";

// the plugin should only work if you're building for KaiOS
const production = process.env.NODE_ENV === "production";

export default function kaiManifest({ isKai3 = false, manifest = {} }: any): PluginOption {
	let config: ResolvedConfig;

	let integrityJS = "";
	let indexJS = "";
	const asmFiles: string[] = [];
	const wasmFiles: string[] = [];
	const memFiles: string[] = [];

	if (production)
		return {
			name: "kai-manifest",

			configResolved(_config) {
				config = _config;
			},

			writeBundle() {
				// console.log("WRITE BUNDLE");

				const distFolder = resolve(config.root, config.build.outDir);

				fs.existsSync(distFolder) || fs.mkdirSync(distFolder);

				const manifestFilePath = resolve(
					config.root,
					config.build.outDir,
					isKai3 ? "manifest.webmanifest" : "manifest.webapp"
				);

				if (isKai3) {
					asmFiles.forEach((a) => {
						fs.rmSync(resolve(distFolder, a));
					});

					memFiles.forEach((a) => {
						fs.rmSync(resolve(distFolder, a));
					});
				} else {
					manifest.precompile = asmFiles;

					wasmFiles.forEach((a) => {
						fs.rmSync(resolve(distFolder, a));
					});
				}

				fs.writeFileSync(manifestFilePath, JSON.stringify(manifest));

				const buffer = fs.readFileSync(resolve(config.root, config.build.outDir, indexJS));
				const indexBuffer = fs.readFileSync(resolve(config.root, config.build.outDir, "index.html"));

				// console.log(config.build.outDir, asmFiles);

				const file = resolve(config.root, config.build.outDir, integrityJS);
				const text = fs.readFileSync(file, "utf-8");
				fs.writeFileSync(
					file,
					text
						.replace('"MANIFEST_GOES_HERE"', JSON.stringify(manifest))
						.replace("MAIN_HASH_GOES_HERE", crypto.hash("sha256", buffer))
						.replace("HTML_HASH_GOES_HERE", crypto.hash("sha256", indexBuffer))
				);
			},

			generateBundle(options, bundle) {
				// console.log("GENERATE BUNDLE");
				for (const fileName in bundle) {
					if (fileName.endsWith(".wasm")) {
						wasmFiles.push(fileName);
					}

					if (fileName.endsWith(".mem")) {
						memFiles.push(fileName);
					}

					if (fileName.endsWith(".js")) {
						if (fileName.includes("asm")) {
							asmFiles.push(fileName);
						}

						if (fileName.includes("checkIntegrity")) integrityJS = fileName;
						if (!indexJS && fileName.includes("index")) indexJS = fileName;
					}
				}
			},
		};
}
