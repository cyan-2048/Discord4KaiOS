export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import fastHashCode from "fast-hash-code";
import scrollIntoView from "scroll-into-view";
import { Fragment, h, render } from "preact";
import { unmountComponentAtNode } from "preact/compat";

export async function centerScroll(el: Element, sync = false, opts: object = {}) {
	return new Promise((res) => {
		scrollIntoView(
			el,
			{
				time: sync ? 0 : 200,
				align: { left: 0 },
				ease: (e: number) => e,
				...opts,
			},
			(type) => res(type === "complete")
		);
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
		const conn = navigator.mozTCPSocket?.open(u.host, 443, {
			useSecureTransport: true,
		});
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

export function delayedCallback(callback: Function, delay: number = 100): () => void {
	const timeout = setTimeout(callback, delay);
	return () => clearTimeout(timeout);
}

export { debounce } from "ts-debounce";

/**
 * simple string to hash function
 */
export function hash(text: string) {
	// @ts-ignore
	return fastHashCode(text, { forcePositive: true }).toString(36);
}

export function toggleCursor(value: boolean): boolean {
	// @ts-ignore
	return (navigator.spatialNavigationEnabled = value);
}

export function scrollToBottom(el?: HTMLElement) {
	if (!el) return;
	return (el.scrollTop = el.scrollHeight);
}

/**
 *
 * @param ns the decimal
 * @param arr should it return rgb in array form
 * @returns
 */
export function decimal2rgb(ns: number, arr: false): { r: number; g: number; b: number };
export function decimal2rgb(ns: number, arr: true): number[];
export function decimal2rgb(ns: number, arr: boolean = false) {
	let r = Math.floor(ns / (256 * 256)),
		g = Math.floor(ns / 256) % 256,
		b = ns % 256;
	return arr ? [r, g, b] : { r, g, b };
}

/**
 * creates a string from a date object, this seems to be what discord does
 */
export function stringifyDate(_date: Date) {
	const date = new Date(_date),
		date_string = date.toDateString(),
		date_time = date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});

	const today = new Date();

	if (today.toDateString() === date_string) {
		return "Today at " + date_time;
	}

	today.setDate(today.getDate() - 1);
	if (today.toDateString() === date_string) {
		return "Yesterday at " + date_time;
	}

	return date.toLocaleDateString();
}

/**
 * sets a value in a map and returns it
 */
export function setMapAndReturn<K, V>(map: Map<K, V>, key: K, value: V) {
	map.set(key, value);
	return value;
}

// this might be useless lmao
function JSXasElement(element: h.JSX.Element) {
	const el = document.createElement("main");
	const rendered = render(h(Fragment, null, element), el);
	return {
		dom: el.children,
		rendered,
		unmount: () => unmountComponentAtNode(el),
	};
}

function getJSXByClassName(className: string, jsxElement: h.JSX.Element) {
	const matching = [];

	const props = jsxElement.props;

	// Check if the element itself has a className prop
	if (props?.className || props?.class) {
		// Check if the className prop matches the specified class name
		const classNames = (props.className || props.class).split(/\s/);
		if (classNames.includes(className)) {
			// Add the matching element to the array
			matching.push(jsxElement);
		}
	}

	// If the element has children, recursively search them for matching elements
	if (props?.children) {
		const childElements = Array.isArray(props.children) ? props.children : [props.children];
		for (let i = 0; i < childElements.length; i++) {
			const matchingChildren = getJSXByClassName(className, childElements[i]);
			if (matchingChildren.length > 0) {
				matching.push(...matchingChildren);
			}
		}
	}

	return matching;
}

const preloadImage = (src: string) =>
	new Promise((resolve) => {
		const image = new Image();
		image.onload = resolve;
		image.onerror = resolve;
		image.src = src;
	});

export function preloadImages(images: string[]) {
	return Promise.all(images.map((a) => preloadImage(a)));
}

export { default as clx } from "obj-str";
