import CustomWorker from "./worker?worker";
import type { Exposed, Emoji } from "./worker";
import * as Comlink from "comlink";

export type { Emoji };

const wrapped = Comlink.wrap<Exposed>(new CustomWorker());

export const findByShortCode = wrapped.findByShortCode;
export const fuzzySearch = wrapped.fuzzySearch;
export const preloadSearch = wrapped.preloadSearch;
export const webp = wrapped.webp;

export const rlottie = {
	loadRlottie: wrapped.loadRlottie,
	isCached: wrapped.isCached,
	loadAnimation: wrapped.loadAnimation,
	requestFrame: wrapped.requestFrame,
} as const;
