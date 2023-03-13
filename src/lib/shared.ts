import { signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { readable } from "svelte/store";
import spatial_navigation from "./spatial_navigation";
import Discord from "discord";

const observed_elements = new WeakMap();

const observer = new IntersectionObserver(
	function callback(entries, observer) {
		entries.forEach(({ target, intersectionRatio }) => {
			const ratio = intersectionRatio === 1;
			if (!observed_elements.has(target)) {
				observer.unobserve(target);
				return;
			}
			const observed = observed_elements.get(target);
			if (ratio !== observed.ratio) {
				observed.ratio = ratio;
				observed.set(ratio);
			}
		});
	},
	{ threshold: [0, 1] }
);

export function observeElement(element: HTMLElement) {
	return readable(false, (set) => {
		observed_elements.set(element, { ratio: null, set });
		observer.observe(element);

		return () => {
			observed_elements.delete(element);
			observer.unobserve(element);
		};
	});
}

export const appReady = signal(false);
export const discordInstance = signal(new Discord(true));

console.log(discordInstance);

export function getToken(): string | null {
	return localStorage.getItem("token");
}

export function setToken(token: string): void {
	localStorage.setItem("token", token);
}

export const sn = spatial_navigation;
