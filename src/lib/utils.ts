export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import { signal } from "@preact/signals";
import fastHashCode from "fast-hash-code";
import { EffectCallback, MutableRef, StateUpdater, useEffect, useState } from "preact/hooks";
import scrollIntoView from "scroll-into-view";
import { get, writable, readable, derived, Writable, Readable, Subscriber, StartStopNotifier } from "svelte/store";

export async function centerScroll(el: Element, sync = false, opts: object = {}) {
	return new Promise((res) => {
		scrollIntoView(el, { time: sync ? 0 : 200, align: { left: 0 }, ease: (e: number) => e, ...opts }, (type) => res(type === "complete"));
	});
}

export enum InternetResults {
	EXPIRED_CERTS,
	OK,
	NO_INTERNET,
}

async function verifyDomainSSL(url) {
	const u = new URL(url);
	return new Promise((resolve, reject) => {
		if (u.protocol === "http:") return resolve(url);
		// @ts-ignore
		const conn = navigator.mozTCPSocket?.open(u.host, 443, { useSecureTransport: true });
		if (!conn) return resolve(url);
		conn.onopen = () => {
			conn.close();
			conn.onerror = () => {};
			resolve(url);
		};
		conn.onerror = (err: Error) => {
			reject(err.name === "SecurityError" && err.message === "SecurityCertificate" ? InternetResults.EXPIRED_CERTS : InternetResults.NO_INTERNET);
		};
	});
}

export async function testInternet() {
	const statusURL = "https://discordstatus.com/api/v2/status.json";
	try {
		if (!navigator.onLine) return InternetResults.NO_INTERNET;
		await verifyDomainSSL(statusURL);

		const res = await fetch(statusURL);
		const { status } = await res.json();
		const index = ["none", "minor", "major", "critical"].indexOf(status.indicator);
		if (index > 1) return InternetResults.NO_INTERNET;
	} catch (e) {
		return typeof e === "number" ? e : InternetResults.NO_INTERNET;
	}
	return InternetResults.OK;
}

export function useMountDebug(name: string) {
	useMount(() => {
		console.log(`<${name} /> mounted`);
		return () => console.log(`<${name} /> unmounted`);
	});
}

export function useInputValue(inputEl: MutableRef<HTMLInputElement | HTMLTextAreaElement>, stateFunc: Function | typeof useState = useState): [string, (value: string) => void] {
	const [value, setValue] = stateFunc("");

	useEffect(() => {
		const el = inputEl.current;
		if (!el) return;
		const handler = () => setValue(el.value);
		el.value = value;
		el.addEventListener("input", handler);
		return () => el.removeEventListener("input", handler);
	}, [inputEl]);

	return [
		value,
		function (value: string) {
			setValue(value);
			if (inputEl.current) inputEl.current.value = value;
		},
	];
}

const memoryState = new Map<any, any>();

export function useMemoryState<T>(key: any, initialState: any): [T, StateUpdater<T>] {
	const [state, setState] = useState<T>(() => {
		const hasMemoryValue = memoryState.has(key);
		if (hasMemoryValue) {
			return memoryState.get(key);
		} else {
			return typeof initialState === "function" ? initialState() : initialState;
		}
	});

	function onChange(nextState: any) {
		memoryState.set(key, nextState);
		setState(nextState);
	}

	return [state, onChange];
}

export function bindedMemoryState<T>(key: any) {
	return (value: any) => {
		return useMemoryState<T>(key, value);
	};
}

export function toggleCursor(value: boolean): boolean {
	// @ts-ignore
	return (navigator.spatialNavigationEnabled = value);
}

/**
 * it's like `onMount` but for hooks
 * @param fn {EffectCallback}
 * @returns {void}
 */
export function useMount(fn: EffectCallback) {
	useEffect(fn, []);
}

export function delayedCallback(callback: Function, delay: number = 100): () => void {
	const timeout = setTimeout(callback, delay);
	return () => clearTimeout(timeout);
}

export { debounce } from "ts-debounce";

export function hash(text: string) {
	// @ts-ignore
	return btoa(fastHashCode(text, { forcePositive: true }));
}

// stolen code: https://www.npmjs.com/package/react-use-svelte-store

export type Setter<T> = (v: T) => void;
export type UpdateFn<T> = (v: T) => T;
export type Updater<T> = (u: UpdateFn<T>) => void;

const unset: any = Symbol();

export function useReadable<T>(store: Readable<T>): T {
	const [value, set] = useState<T>(unset as unknown as T);

	useEffect(() => store.subscribe(set), [store]);

	return value === unset ? get(store) : value;
}

export function useWritable<T>(store: Writable<T>): [T, Setter<T>, Updater<T>] {
	const value = useReadable(store);
	return [value, store.set, store.update];
}
