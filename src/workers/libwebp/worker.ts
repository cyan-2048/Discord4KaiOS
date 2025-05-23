import AsmMemURL from "./libwebp.js.mem?url";
import AsmURL from "./libwebp.asm.js?url";

let asm: any;

async function _loadLibWebp(): Promise<true> {
	if (import.meta.env.KAIOS == 3) {
		asm = null;
	} else {
		if (import.meta.env.DEV) {
			const { factory } = await import("./libwebp.asm.dev");
			asm = await factory({
				locateFile() {
					return AsmMemURL;
				},
			});
		} else {
			const m = await System.import(AsmURL);
			const factory = m.default;
			asm = await factory({
				locateFile() {
					return AsmMemURL;
				},
			});
		}
	}

	console.info("libwebp loaded!");

	return true;
}

let loaded: Promise<true> | null = null;

function loadLibWebp(): Promise<true> {
	if (loaded) return loaded;
	return (loaded = _loadLibWebp());
}

function getUint8Memory(): Uint8Array {
	return asm.HEAPU8;
}

const MAX_MEMORY = 16777216;

interface WebpDecoded {
	width: number;
	height: number;
	rgba: Uint8ClampedArray;
}

function getAvailableMemory() {
	return MAX_MEMORY - asm._getUsedMemory();
}

/**
 * convert webp to rgba
 * width and height is required so no OOM will occur
 */
export async function webp(buff: Uint8Array, width: number, height: number): Promise<WebpDecoded | null> {
	await loadLibWebp();

	if (buff.length + width * height * 4 > getAvailableMemory()) {
		console.error("WEBP CONVERSION FAILED BECAUSE NOT ENOUGH MEMORY");
		return null;
	}

	// console.time("webp");

	// console.info("available memory before allocating", getAvailableMemory());
	const buffPointer = asm._malloc(buff.length);
	// console.info("available memory after allocating", getAvailableMemory());
	const mem = getUint8Memory();
	mem.set(buff, buffPointer);

	// returns zero if failed
	const decodedPtr = asm._webp_decode(buffPointer, buff.length);
	// console.info("available memory after decoding", getAvailableMemory());

	if (!decodedPtr) {
		// console.error("error occured while decoding webp using asm.js");
		asm._free(buffPointer);
		// console.info("available memory after freeing buffer", getAvailableMemory());

		// console.timeEnd("webp");
		return null;
	}

	width = asm._webp_getWidth();
	height = asm._webp_getHeight();

	const rgba = new Uint8ClampedArray(mem.slice(decodedPtr, decodedPtr + width * height * 4).buffer);

	// this function seems to be allocating more memory than actually freeing it???
	asm._webp_free(decodedPtr);
	// console.info("available memory after freeing decodedBuffer", getAvailableMemory());

	asm._free(buffPointer);
	// console.info("available memory after freeing buffer", getAvailableMemory());

	// console.timeEnd("webp");

	return {
		rgba,
		width,
		height,
	};
}
