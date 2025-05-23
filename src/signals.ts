import {
	DiscordClient,
	DiscordClientReady,
	DiscordDMChannel,
	DiscordGroupDMChannel,
	DiscordGuild,
	DiscordGuildTextChannel,
	DiscordSetup,
} from "discord";

import captcha, { CaptchaResult } from "@/lib/captcha";
import { JSX, Signal, createRoot, createSignal, getOwner, observable, runWithOwner, untrack } from "solid-js";
import localforage from "localforage";
import { SkinVariation } from "./views/components/EmojiPicker";
import type { APIMessageReference } from "discord-api-types/v10";

export const discordSetup = new DiscordSetup();

discordSetup.on("captcha", (evt: any) => {
	console.log("CAPTCHA RECEIVED");
	evt.register(
		new Promise(async (res, rej) => {
			const result = await captcha(evt.sitekey);
			if (result.result === CaptchaResult.SUCCESS) {
				res(result.token);
			} else {
				res(null as any);
			}
		})
	);
});

const [$longpress, setLongpress] = createSignal(false);

let longpress_timer: Timer;

window.addEventListener(
	"keydown",
	({ repeat }) => {
		syncMetaThemeColor();
		// sucessfully longpressed
		if (repeat) {
			clearTimeout(longpress_timer);
			setLongpress(true);
			return;
		}
		if (untrack($longpress) || repeat) return;
		longpress_timer = setTimeout(() => {
			setLongpress(true);
		}, 400);
	},
	true
);

window.addEventListener(
	"keyup",
	() => {
		syncMetaThemeColor();
		clearTimeout(longpress_timer);
		setLongpress(false);
	},
	true
);

export { $longpress };

export const [discordClient, setDiscordClient] = createSignal<DiscordClient | null>(null);
export const [discordClientReady, setDiscordClientReady] = createSignal<DiscordClientReady | null>(null);
export const [currentDiscordGuild, setCurrentDiscordGuild] = createSignal<DiscordGuild | null>(null);
export const [currentDiscordChannel, setCurrentDiscordChannel] = createSignal<DiscordDMChannel | DiscordGuildTextChannel | DiscordGroupDMChannel | null>(null);

type MessageToForward = Omit<APIMessageReference, "type" | "guild_id"> & {
	guild_id: null | string | undefined;
};

export const [currentForwardingMessage, setCurrentForwardMessage] = createSignal<MessageToForward | null>(null);

const storedStateMap = new Map<string, Signal<any>>();

function storedSignal<T = any>(name: string, defaultValue: T): Signal<T> {
	if (storedStateMap.has(name)) {
		return storedStateMap.get(name) as Signal<T>;
	}

	return runWithOwner(null, () => {
		const [state, setState] = createSignal(defaultValue, {
			name: "storedSignal",
		});
		const $observer = observable(state);

		let init = false;

		localforage.ready().then(() => {
			localforage.getItem<T>(name).then((value) => {
				if (value !== null) {
					setState(() => value);
				}
				init = true;
			});
		});

		$observer.subscribe((value) => {
			if (init) {
				localforage.setItem(name, value);
			}
		});

		return [state, setState];
	})!;
}

export const enum ThemeStyle {
	DARK,
	LIGHT,
}

// SETTINGS

export const [themeStyle, setTheme] = storedSignal("themeStyle", ThemeStyle.DARK);
export const [smoothScroll, setSmoothScroll] = storedSignal("smoothScroll", true);
export const [thumbhashPreview, setThumbhashPreview] = storedSignal("thumbhash", true);
export const [imageFormatGuildIcon, setImageFormatGuildIcon] = storedSignal("imageFormat.GuildIcon", "png");
export const [animateApp, setAnimate] = storedSignal("animateApp", true);
export const [disableDiscordLinkLabels, setDisableDiscordLinkLabels] = storedSignal("disableMsgLinkLabel", false);
export const [preserveDeleted, setPreserveDeleted] = storedSignal("preserveDeleted", false);
export const [ezgifAllowed, setEzgifAllowed] = storedSignal("ezgifAllowed", false);
export const [emojiVariation, setEmojiVariation] = storedSignal("emojiVariation", null as SkinVariation | null);

storedSignal("frequentEmojis", []);

observable(themeStyle).subscribe((value) => {
	document.body.classList.toggle("light", value === ThemeStyle.LIGHT);
});
observable(animateApp).subscribe((value) => {
	document.body.classList.toggle("animate", value);
});

if (import.meta.env.DEV) {
	document.body.classList.toggle("light", !window.matchMedia("(prefers-color-scheme: dark)").matches);
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
		document.body.classList.toggle("light", !event.matches);
	});
}

export function useStoredSignal<T>(initial: T | (() => T), key: string): Signal<T> {
	const signalFromMap = storedStateMap.get(key);

	if (signalFromMap) {
		return signalFromMap;
	}

	console.log("Creating new stored signal", key);

	const signal = storedSignal(key, typeof initial == "function" ? (initial as () => T)() : initial);

	storedStateMap.set(key, signal);

	return signal;
}

export function getStoredSignalValue<T>(key: string): T | null {
	const signal = storedStateMap.get(key);

	if (!signal) {
		return null;
	}

	return untrack(signal[0]);
}

export const [statusbarColor, setStatusbarColor] = createSignal("rgb(0,0,0)");

const metaThemeColor = document.querySelector("meta[name=theme-color]")!;
function syncMetaThemeColor() {
	metaThemeColor.setAttribute("content", statusbarColor());
}
observable(statusbarColor).subscribe(syncMetaThemeColor);
export { syncMetaThemeColor as forceUpdateStatusBarColor };

export const channelHistory = new Map<DiscordGuild | null, DiscordGuildTextChannel<any>>();

// i notice it takes a noticable amount of time to load the stored state
localforage.ready().then(() => {
	localforage.iterate((val, key) => {
		const has = storedStateMap.get(key);
		if (has) has[1](val);
		else {
			const _signal = createSignal(val, {
				name: "storedSignal",
			});
			storedStateMap.set(key, _signal);
			let init = true;
			observable(_signal[0]).subscribe((value) => {
				// to avoid unnecessary setting of the value
				if (init) {
					init = false;
					return;
				}
				localforage.setItem(key, value);
			});
		}
	});
});

// VIEWS
export const enum Views {
	GUILDS,
	CHANNELS,
	MESSAGES,
}

export const [currentView, setCurrentView] = createSignal<Views>(Views.GUILDS);

export function restartApp() {
	// fool-proof we don't really care about reloading JS since it's all local and it doesn't seem broken
	window.location.reload();
}

const url = import.meta.url;

export const integrityCheck = import("./lib/checkIntegrity").then((m) => m.default(url));

export const [transform, setTransform] = createSignal<JSX.CSSProperties["transform"]>(undefined);
