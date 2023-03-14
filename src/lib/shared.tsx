import { signal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { readable } from "svelte/store";
import spatial_navigation from "./spatial_navigation";
import Discord from "discord";
import { route } from "preact-router";
import { InternetResults, sleep, testInternet } from "./utils";
import { Guild } from "discord/Guilds";
import { h } from "preact";

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

export function getToken(): string | null {
	return localStorage.getItem("token");
}

export function setToken(token: string): void {
	localStorage.setItem("token", token);
	if (!appReady.peek()) appReady.value = true;
}

export const sn = spatial_navigation;

export const appReady = signal(false);
export const discordInstance = signal(new Discord(true));
console.log(discordInstance.peek());
export const guilds = signal<Guild[]>([]);

export async function loadDiscord() {
	const discord = discordInstance.peek();
	await discord.gateway.close();

	route("/", true);

	appReady.value = false;

	const internetConnection = await testInternet();
	if (internetConnection !== InternetResults.OK) {
		if (InternetResults.EXPIRED_CERTS) {
			alert("You have expired certificate problem thing, go to the KaiStore to get the update.");
		} else {
			alert("You don't have internet go away");
		}
		return window.close();
	}

	const token = getToken();

	if (!token) {
		appReady.value = true;
		await sleep(100);
		route("/login", true);
		return;
	}

	await discord.login(token);

	guilds.value = discord.gateway.guilds.getAll();
	console.log(guilds.peek());

	appReady.value = true;

	await sleep(100);
	route("/channels/@me/");
}

export type RouteProps<T> = {
	path?: string;
	url?: string;
	matches?: Partial<T>;
} & Partial<T>;
