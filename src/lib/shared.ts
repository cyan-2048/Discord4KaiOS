import spatial_navigation from "./spatial_navigation";
import Discord, { readable } from "discord";

import { InternetResults, preloadImages, sleep, testInternet } from "./utils";
import { Guild } from "discord/Guilds";
import { ChannelBase } from "discord/GuildChannels";
import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";

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
	if (!appReady()) setAppReady(true);
}

export const sn = spatial_navigation;

 const [appReady, setAppReady] = createSignal(false);
 const [discordInstance, setDiscordInstance] = createSignal(new Discord(true));
 const [guilds, setGuilds] = createSignal<Guild[]>([]);
 const [currentChannel, setCurrentChannel] = createSignal<ChannelBase | null>(null);

 export {appReady, discordInstance, guilds, currentChannel}

export async function loadDiscord() {
	const route = useNavigate()
	await sleep(100);

	setAppReady(false);

	let discord = discordInstance();
	await discord.gateway.close();
	discord = new Discord(true);
	setDiscordInstance(discord)

	console.log(discordInstance());

	route("/", {replace:true});

	const internetConnection = await testInternet();
	if (internetConnection !== InternetResults.OK) {
		alert(
			internetConnection === InternetResults.EXPIRED_CERTS ? "You have expired certificate problem thing, go to the KaiStore to get the update." : "You don't have internet go away"
		);
		return window.close();
	}

	const token = getToken();

	if (!token) {
		setAppReady(true);
		await sleep(100);
		route("/login", {replace: true});
		return;
	}

	await discord.login(token);

	const __guilds = (discord.gateway.guilds.getAll());

	setGuilds(__guilds)

	console.log("PRELOADING IMAGES");
	const toPreload: string[] = [];
	__guilds.forEach((a) => {
		const { icon, id } = a.rawGuild;
		// https://cdn.discordapp.com/icons/${guild.id}/${props.icon}.${animated && focused ? "gif" : "png"}?size=48
		icon?.startsWith("a_") && toPreload.push(`https://cdn.discordapp.com/icons/${id}/${icon}.gif?size=48`);
	});
	preloadImages(toPreload);

	console.log(__guilds);

	setAppReady(true);

	await sleep(10);
	route("/channels/@me/");
	discord.gateway.on("close", loadDiscord);
}

export type RouteProps<T> = {
	path?: string;
	url?: string;
	matches?: Partial<T>;
} & Partial<T>;
