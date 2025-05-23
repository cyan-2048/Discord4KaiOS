import { WritableStore, shallowEqual } from "discord";

import scrollIntoView from "scroll-into-view";
import playVideo from "./playVideo";
import Deferred from "discord/src/lib/Deffered";
import EventEmitter from "discord/src/lib/EventEmitter";
import localforage from "localforage";
import { QRCode } from "./qrCode";
import { Accessor, createEffect, createSignal, observable, on, onCleanup, untrack } from "solid-js";

export function normalizeCSSNumber(value: string | number | null | undefined) {
	if (value == null) return undefined;
	if (typeof value === "string") return value;
	return value + "px";
}

export { scrollIntoView };

export function waitForVisibility(): Promise<void> {
	return new Promise((resolve) => {
		// Check if the document is already visible
		if (document.visibilityState === "visible") {
			resolve();
		} else {
			// Listen for the visibilitychange event
			const onVisibilityChange = () => {
				if (document.visibilityState === "visible") {
					// If visibility becomes visible, resolve the promise and remove the event listener
					resolve();
					document.removeEventListener("visibilitychange", onVisibilityChange);
				}
			};

			document.addEventListener("visibilitychange", onVisibilityChange);
		}
	});
}

export function patchFunction(originalFunction: Function, patchedFunction: Function) {
	return function (this: any) {
		patchedFunction.apply(this, arguments);
		return originalFunction.apply(this, arguments);
	};
}

export function waitForSignal<T>(signal: Accessor<T>, valueToWaitFor: T, callback: (val: T) => void) {
	if (untrack(signal) === valueToWaitFor) {
		callback(valueToWaitFor);
		return () => {};
	}

	const o = observable(signal);

	const unsub = o.subscribe((val) => {
		if (val === valueToWaitFor) {
			callback(val);
			unsub.unsubscribe();
		}
	});

	return () => unsub.unsubscribe();
}

export function useStore<T>(_readable: WritableStore<T> | (() => WritableStore<T>)): Accessor<T>;
export function useStore<T, R extends keyof T>(
	_readable: WritableStore<T> | (() => WritableStore<T>),
	key: R
): Accessor<T[R]>;
export function useStore<T, R extends keyof T>(
	_readable: WritableStore<T> | (() => WritableStore<T>),
	key?: R
) {
	const readable = () => (typeof _readable === "function" ? _readable() : _readable);

	const [state, setState] = createSignal(key != undefined ? readable().value[key] : readable().value, {
		equals: (a, b) => {
			// we only do shallow compare if key is undefined
			if (key != undefined) {
				return shallowEqual(a, b);
			} else {
				// svelte stores don't do shallow equality checks
				return false;
			}
		},
		name: "useStore",
	});

	createEffect(() => {
		const unsub = readable().subscribe((val) => {
			setState(() => (key != undefined ? val[key] : val));
		});

		onCleanup(unsub);
	});

	return state;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function decimal2rgb(ns: number, arr = false) {
	let r = Math.floor(ns / (256 * 256)),
		g = Math.floor(ns / 256) % 256,
		b = ns % 256;
	return arr ? [r, g, b] : { r, g, b };
}

const [isKeypressPaused, setKeypressPaused] = createSignal(false);

export function pauseKeypress() {
	setKeypressPaused(true);
}

export function resumeKeypress() {
	setKeypressPaused(false);
}

export { isKeypressPaused };

export const useKeypress = (keys: string | string[], handler: (e: KeyboardEvent) => void, force = false) => {
	const eventListener = (event: KeyboardEvent) => {
		if (isKeypressPaused() && !force) return;

		const _keys = [keys].flat();

		if (_keys.includes(event.key)) {
			handler(event);
		}
	};

	window.addEventListener("keydown", eventListener, true);

	onCleanup(() => {
		window.removeEventListener("keydown", eventListener, true);
	});
};

export function niceBytes(bytes: number, decimals = 2) {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function sameDay(d1: Date, d2: Date) {
	return (
		d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
	);
}

export const useLongKeypress = (
	keys: string | string[],
	longPressOccured: (e: KeyboardEvent) => void,
	longPressCancelled: null | ((e: KeyboardEvent) => void),
	longPressDuration = 500,
	force = false
) => {
	let timestamp = 0;

	const eventListenerPress = (event: KeyboardEvent) => {
		if (isKeypressPaused() && !force) return;

		if (Array.isArray(keys) ? keys.includes(event.key) : keys === event.key) {
			timestamp = Date.now();
		}
	};

	const eventListenerRelease = (event: KeyboardEvent) => {
		if (isKeypressPaused() && !force) return;

		if (Array.isArray(keys) ? keys.includes(event.key) : keys === event.key) {
			const pressed = timestamp,
				released = Date.now();
			if (released - pressed < longPressDuration) {
				longPressCancelled?.(event);
			} else {
				longPressOccured?.(event);
			}
		}
	};

	window.addEventListener("keydown", eventListenerPress, true);
	window.addEventListener("keyup", eventListenerRelease, true);

	onCleanup(() => {
		window.removeEventListener("keydown", eventListenerPress, true);
		window.removeEventListener("keyup", eventListenerRelease, true);
	});
};

export function typeInTextarea(
	newText: string,
	el = document.activeElement as HTMLTextAreaElement | HTMLInputElement
) {
	const start = el.selectionStart!;
	const end = el.selectionEnd!;
	const text = el.value;
	const before = text.substring(0, start);
	const after = text.substring(end, text.length);
	el.value = before + newText + after;
	el.selectionStart = el.selectionEnd = start + newText.length;
	el.focus();
	el.dispatchEvent(new Event("input", { bubbles: true }));
}

export function centerScroll(el: HTMLElement, sync = false, time = 100) {
	return new Promise<boolean>((res) => {
		scrollIntoView(
			el,
			{ time: sync ? 0 : time, align: { left: 0 }, ease: (e: number) => e },
			(type: string) => {
				res(type === "complete");
				keydownEM.emit("scroll");
			}
		);
	});
}

const emptyCombo = "0".repeat(10);
let combo = emptyCombo;

const comboMap = new Map<string, Set<() => void>>();

export function handleCombo(combo: string, callback: () => void) {
	comboMap.get(combo) || comboMap.set(combo, new Set()).get(combo)!?.add(callback);
}

handleCombo("911", () => {
	confirm("emergency? do you want to close the app?") && window.close();
});

handleCombo("555", () => {
	// @ts-ignore
	navigator.spatialNavigationEnabled = !navigator.spatialNavigationEnabled;
});

const nekoweb = "https://cyandiscordclient.nekoweb.org/";

handleCombo("1234567", () => {
	playVideo(nekoweb + "7.mp4");
});

handleCombo("79", async () => {
	// do the qr thing
	const result = await new QRCode().readAsText();
	await localforage.clear();
	await localforage.setItem("token", result);
	location.reload();
});

const keydownEM = new EventEmitter<{ keydown: [KeyboardEvent]; scroll: [] }>();

window.addEventListener("keydown", (e) => {
	keydownEM.emit("keydown", e);
	if (e.key === "Call" || e.key === "F1") {
		const _combo = combo;
		comboMap.forEach((val, key) => {
			if (_combo.endsWith(key)) {
				val.forEach((cb) => cb());
				combo = emptyCombo;
			}
		});
	} else {
		combo = (combo + e.key).slice(-10);
	}
});

export { default as playVideo } from "./playVideo";

export { Deferred };

export function isInViewport(el: HTMLElement) {
	const bounding = el.getBoundingClientRect();
	return (
		bounding.top >= 0 &&
		bounding.left >= 0 &&
		bounding.bottom <= window.innerHeight &&
		bounding.right <= window.innerWidth
	);
}

export function isPartiallyInViewport(el: HTMLElement) {
	const bounding = el.getBoundingClientRect();
	const myElementHeight = el.offsetHeight;
	const myElementWidth = el.offsetWidth;

	return (
		bounding.top >= -myElementHeight &&
		bounding.left >= -myElementWidth &&
		bounding.right <= window.innerWidth + myElementWidth &&
		bounding.bottom <= window.innerHeight + myElementHeight
	);
}

export function createRef<T = any>(initialValue?: T) {
	const ref = { current: initialValue as T };
	return ref;
}
