// export * from "preact/hooks";

// import { Readable, get, Writable } from "discord/main";
// import { useEffect, EffectCallback, MutableRef, StateUpdater, useState, useRef, useCallback } from "preact/hooks";
import { sn } from "./shared";
import { createRenderEffect, createSignal, onCleanup, onMount } from "solid-js";

export function useMountDebug(name: string) {
	useMount(() => {
		console.log(`<${name} /> mounted`);
		return () => console.log(`<${name} /> unmounted`);
	});
}

/**
 * it's like `onMount` but for hooks
 */
export function useMount(fn: () => any | (() => () => any)) {
	let cleanup: () => any;
	onMount(() => {
		const result = fn();
		if (typeof result === "function") {
			cleanup = result;
		}
	});
	onCleanup(() => {
		cleanup?.();
	});
}

// stolen code: https://www.npmjs.com/package/react-use-svelte-store
export type Setter<T> = (v: T) => void;
export type UpdateFn<T> = (v: T) => T;
export type Updater<T> = (u: UpdateFn<T>) => void;

interface SpatialNavigationOptions {
	id: string;
	selector: string;
	enterTo?: string;
	leaveFor?: string;
	defaultElement?: string;
	restrict?: "self-first" | "self-only" | "none";
	rememberSource?: boolean;
}

/**
 * Function that takes spacial nav options and removes it when unmounted
 */
export function useSpatialNav(...options: SpatialNavigationOptions[]) {
	useMount(() => {
		options.forEach((opt) => sn.add(opt));
		return () => options.forEach((opt) => sn.remove(opt.id));
	});
}

/**
 * similar to svelte's onDestroy
 */
export function useDestroy(func: () => void) {
	onCleanup(func);
}

export function inputValue(e: null): null;
export function inputValue(
	el: HTMLInputElement | HTMLTextAreaElement,
	value?: () => [() => string, (v: string) => void]
) {
	if (el === null) return null;
	const [field, setField] = value();

	createRenderEffect(() => (el.value = field()));

	// @ts-ignore
	el.addEventListener("input", (e) => setField(e.target.value));
}

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			inputValue: [() => any, (v: any) => any];
			focusElement: any;
		}
	}
}
