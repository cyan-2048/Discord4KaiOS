export * from "preact/hooks";

import { Readable, get, Writable } from "discord/main";
import { useEffect, EffectCallback, MutableRef, StateUpdater, useState, useRef, useCallback, Ref } from "preact/hooks";
import { sn } from "./shared";

export function useMountDebug(name: string) {
	useMount(() => {
		console.log(`<${name} /> mounted`);
		return () => console.log(`<${name} /> unmounted`);
	});
}

export function useInputValue(inputEl: Ref<HTMLInputElement | HTMLTextAreaElement>, stateFunc: Function | typeof useState = useState): [string, (value: string) => void] {
	const [value, setValue] = stateFunc("");

	useEffect(() => {
		const el = inputEl.current;
		if (!el) return;
		const handler = () => setValue(el.value);
		el.value = value;
		el.addEventListener("input", handler);
		return () => el.removeEventListener("input", handler);
	}, [inputEl.current]);

	return [
		value,
		function (value: string) {
			setValue(value);
			if (inputEl.current) inputEl.current.value = value;
		},
	];
}

const memoryState = new Map<any, any>();

export function useMemoryState<T>(key: any, initialState: T): [T, StateUpdater<T>] {
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

/**
 * @returns a useMemoryState function that is bound to a key, basically it returns a function similar to useState
 */
export function bindedMemoryState<T>(key: any) {
	return (value: any) => useMemoryState<T>(key, value);
}

/**
 * it's like `onMount` but for hooks
 */
export function useMount(fn: EffectCallback) {
	useEffect(fn, []);
}

// stolen code: https://www.npmjs.com/package/react-use-svelte-store
export type Setter<T> = (v: T) => void;
export type UpdateFn<T> = (v: T) => T;
export type Updater<T> = (u: UpdateFn<T>) => void;

/**
 * This is like useState, but it doesn't compare the new state to the old state.
 * fuck you React for making me do this
 */
export function useStateMutable<T>(initialState: T): [T, (newState: T) => void] {
	// should i rename this to useMutableState?
	const [state, setState] = useState([initialState]);
	return [state[0], (newState: T) => setState([newState])];
}

/**
 * use svelte readables on preact hooks
 */
export function useReadable<T>(store: Readable<T>): T {
	const [value, set] = useStateMutable(get(store));

	useEffect(() => store.subscribe(set), [store]);

	return value;
}

/**
 * use svelte writables on preact hooks
 */
export function useWritable<T>(store: Writable<T>): [T, Setter<T>, Updater<T>] {
	const value = useReadable(store);
	return [value, store.set, store.update];
}

/**
 * returns a function similar to this.forceUpdate()
 */
export function useForceUpdate(): () => void {
	// @ts-ignore idk
	return useReducer((x) => x + 1, 0)[1];
}

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
	useMount(() => func);
}

/**
 * useRef but with useState-like behaviour, kinda a solid.js rip off
 */
export function useRefFunctional<T = any>(value?: T | null): [() => T | null | undefined, StateUpdater<T>, MutableRef<T | null | undefined>] {
	const ref = useRef<T | null | undefined>(value);

	return [
		useCallback(() => ref.current, []),
		useCallback((value) => {
			ref.current = typeof value == "function" ? (value as Function)(ref.current) : value;
		}, []),
		ref,
	];
}

export function bindToWindow<K extends keyof WindowEventMap>(evt: K, callback: (this: Window, ev: WindowEventMap[K]) => any) {
	useEffect(() => {
		window.addEventListener(evt, callback);
		return () => window.removeEventListener(evt, callback);
	}, [callback]);
}
