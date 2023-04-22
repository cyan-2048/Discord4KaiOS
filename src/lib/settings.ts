import { writable } from "discord";
import { useWritable } from "@hooks";

interface KeyBinds {
	[key: KeyboardEvent["key"]]: "edit" | "jump" | "reply" | "react" | "pin" | "delete";
}

interface Json {
	[x: string]: string | number | boolean | Date | Json | JsonArray;
}

interface JsonArray extends Array<string | number | boolean | Date | Json | JsonArray> {}

interface Settings extends Json {
	custom_rpc: boolean;
	prompt_delete: boolean;
	smooth_scroll: boolean;
	preserve_deleted: boolean;
	devmode: boolean;
	fromToken: boolean;
	keybinds: KeyBinds;
}

const defaultSettings: Settings = {
	custom_rpc: false,
	prompt_delete: false,
	smooth_scroll: true,
	preserve_deleted: false,
	fromToken: false,
	// @ts-ignore
	devmode: !PRODUCTION as boolean,
	keybinds: {
		"*": "edit",
		0: "jump",
		"#": "reply",
		1: "react",
		2: "pin",
		3: "delete",
	},
};

const settingsPrefix = "d4k-settings-";

function loadSettings(): Settings {
	const loadedSettings: any = {};
	for (const key in defaultSettings) {
		const storageKey = settingsPrefix + key;
		const value = localStorage.getItem(storageKey);
		if (value) {
			loadedSettings[key] = JSON.parse(value);
		}
	}

	return { ...defaultSettings, ...loadedSettings };
}

const loadedSettings = loadSettings();
const settingsWriteable = writable(loadedSettings);

export function saveSettings(partialSettings: Partial<Settings>): void {
	let updateOccured = false;
	const updatedSettings = partialSettings;
	for (const key in updatedSettings) {
		if (!(key in defaultSettings)) continue;
		if (!updateOccured) updateOccured = true;
		const storageKey = settingsPrefix + key;
		const value = JSON.stringify(updatedSettings[key]);
		localStorage.setItem(storageKey, value);
	}

	updateOccured && settingsWriteable.update((settings) => ({ ...settings, ...updatedSettings }));
}

export default function useSettings(): [Settings, (settings: Partial<Settings>) => void] {
	const [settings, setSettings, updateSettings] = useWritable(settingsWriteable);

	return [settings, saveSettings];
}
