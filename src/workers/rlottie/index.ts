import * as Comlink from "comlink";
// @ts-ignore
import type { Exposed } from "./worker";
import RlottieWorker from "./worker?worker";

const wrapped = Comlink.wrap<Exposed>(new RlottieWorker());

let rLottieLoaded: Promise<true> | null = null;

export function loadRlottie() {
	if (rLottieLoaded) return rLottieLoaded;
	return (rLottieLoaded = wrapped.loadRlottie());
}

export const isCached = wrapped.isCached;
export const loadAnimation = wrapped.loadAnimation;
export const requestFrame = wrapped.requestFrame;
