// the worker implementation seems to actually cause low fps?

import AsmMemURL from "./asmjs/rlottie-wasm.js.mem?url";
import AsmURL from "./asmjs/rlottie-wasm.asm.js?url";
import WasmURL from "./wasm/rlottie-wasm.wasm?url";

import * as Comlink from "comlink";
import { LRUCache } from "lru-cache";

interface IRlottieWasm {
	load(data: string): void;
	frames(): number;
	render(frame: number, width: number, height: number): Uint8Array;
	delete(): void;
}

const rLottieCache = new LRUCache<string, IRlottieWasm>({
	max: 5,
	dispose(
		lottie
		//, sticker, reason
	) {
		lottie.delete();
		// console.info("dispose", sticker, reason);
	},
});

let RlottieWasm: any;

async function _loadRlottie(): Promise<true> {
	if (import.meta.env.KAIOS == 3) {
		// @ts-ignore
		const { default: factory } = await import("./wasm/rlottie-wasm.js");
		const Module = await factory({
			locateFile() {
				return WasmURL;
			},
		});

		RlottieWasm = Module.RlottieWasm;
	} else {
		if (import.meta.env.DEV) {
			const { factory } = await import("./asmjs/rlottie-wasm.asm.dev");
			const Module = await factory({
				locateFile() {
					return AsmMemURL;
				},
			});
			RlottieWasm = Module.RlottieWasm;
		} else {
			const m = await System.import(AsmURL);
			const factory = m.default;
			const Module = await factory({
				locateFile() {
					return AsmMemURL;
				},
			});
			RlottieWasm = Module.RlottieWasm;
		}
	}

	console.info("RlottieWasm loaded!");

	return true;
}

let loaded: Promise<true> | null = null;

function loadRlottie(): Promise<true> {
	if (loaded) return loaded;
	return (loaded = _loadRlottie());
}

/**
 * if it is cached, returns number of frames
 */
function isCached(id: string) {
	const has = rLottieCache.get(id);
	return has ? has.frames() : false;
}

/**
 * loads animation, return number of frames
 */
async function loadAnimation(id: string, data: string) {
	console.info("Loading Rlottie " + id);
	const instance = new RlottieWasm();

	instance.load(data);

	rLottieCache.set(id, instance);

	return instance.frames() as number;
}

/**
 * requests an animation frame given the ID
 */
function requestFrame(id: string, frame: number, width: number, height: number) {
	const instance = rLottieCache.get(id);

	if (!instance) throw new Error("sticker does not exist!");

	const buffer = instance.render(frame, width, height);
	const result = Uint8ClampedArray.from(buffer);

	return Comlink.transfer(result, [result.buffer]);
}

export { loadRlottie, isCached, loadAnimation, requestFrame };

// export type Exposed = typeof exposed;

// Comlink.expose(exposed);
