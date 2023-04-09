import { writable } from "discord/main";
import { useState, useEffect } from "preact/hooks";
import { useWritable } from "./utils";

interface KeyBinds {
	[key: KeyboardEvent["key"]]:
		| "edit"
		| "jump"
		| "reply"
		| "react"
		| "pin"
		| "delete";
}

interface Settings {
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

function validateSettings(
	partialSettings: Partial<Settings>
): Partial<Settings> {
	const validatedSettings = {} as Partial<Settings>;
	for (const key in partialSettings) {
		const defaultValue = defaultSettings[key];
		const inputValue = partialSettings[key];
		if (Array.isArray(defaultValue)) {
			validatedSettings[key] = Array.isArray(inputValue)
				? inputValue
				: defaultValue;
		} else if (typeof defaultValue === "object" && defaultValue !== null) {
			validatedSettings[key] = validateSettings(
				inputValue as Partial<typeof defaultValue>
			);
		} else {
			validatedSettings[key] =
				typeof inputValue === typeof defaultValue ? inputValue : defaultValue;
		}
	}
	return validatedSettings;
}

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

	return { ...defaultSettings, ...validateSettings(loadedSettings) };
}

const loadedSettings = loadSettings();
const settingsWriteable = writable(loadedSettings);

export default function useSettings(): [
	Settings,
	(settings: Partial<Settings>) => void
] {
	const [settings, setSettings, updateSettings] =
		useWritable(settingsWriteable);

	function saveSettings(partialSettings: Partial<Settings>): void {
		let updateOccured = false;
		const updatedSettings = validateSettings(partialSettings);
		for (const key in updatedSettings) {
			if (!updateOccured) updateOccured = true;
			const storageKey = settingsPrefix + key;
			const value = JSON.stringify(updatedSettings[key]);
			localStorage.setItem(storageKey, value);
		}

		updateOccured &&
			updateSettings((settings) => ({ ...settings, ...updatedSettings }));
	}

	return [settings, saveSettings];
}
