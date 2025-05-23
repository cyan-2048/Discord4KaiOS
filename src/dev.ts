import * as signals from "./signals";
import * as utils from "./lib/utils";
import * as solid from "solid-js";
import Logger from "discord/src/Logger";
import { toast } from "./views/modals/toast";
import * as discord from "discord";

// @ts-ignore
Logger.prototype._log = function (type, ...args) {
	const binded = Function.prototype.bind.call(
		console[type],
		console,
		`%c[${this.name}]%c`,
		`color: ${this.color}; font-weight: 700;`,
		"",
		...args
	);

	return binded;
};

const KeyboardEvent_key_property = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, "key")!;
Object.defineProperty(KeyboardEvent.prototype, "key", {
	enumerable: true,
	configurable: true,
	get(this: KeyboardEvent) {
		const evt_key = KeyboardEvent_key_property.get!.call(this) as string;
		if (
			(this.ctrlKey || this.altKey) &&
			evt_key.startsWith("Arrow") &&
			(evt_key.endsWith("Left") || evt_key.endsWith("Right"))
		) {
			return "Soft" + evt_key.slice(5);
		}

		if (
			this.shiftKey &&
			evt_key.startsWith("Arrow") &&
			(evt_key.endsWith("Left") || evt_key.endsWith("Right"))
		) {
			return evt_key.endsWith("Left") ? "*" : "#";
		}
		return evt_key;
	},
});

Object.assign(window, {
	signals,
	solid,
	utils,
	toast,
	discord,
});

const ReactNativeWebView = "ReactNativeWebView" in window && (window.ReactNativeWebView as any);

type RNMessage =
	| {
			action: "move";
			direction: "up" | "down" | "left" | "right";
	  }
	| {
			action: "key";
			key:
				| "Enter"
				| "Backspace"
				| "SoftLeft"
				| "SoftRight"
				| "1"
				| "2"
				| "3"
				| "4"
				| "5"
				| "6"
				| "7"
				| "8"
				| "9"
				| "0";
	  };

function capitalizeFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function dispatchKeyboardEvent(key: string, keyCode?: number) {
	const init = {
		key,
		keyCode: keyCode,
		composed: true,
		bubbles: true,
		cancelable: true,
	} as any;

	document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", init));
	utils.sleep(200).then(() => {
		document.activeElement?.dispatchEvent(new KeyboardEvent("keyup", init));
	});
}

if (ReactNativeWebView) {
	const __KORI__ = {
		handleMessage: (message: string) => {
			const data = JSON.parse(message) as RNMessage;

			if (data.action === "move") {
				const key = "Arrow" + capitalizeFirstLetter(data.direction);

				var KEYMAPPING = {
					left: 37,
					up: 38,
					right: 39,
					down: 40,
				};

				dispatchKeyboardEvent(key, KEYMAPPING[data.direction]);
			} else if (data.action === "key") {
				dispatchKeyboardEvent(data.key, data.key === "Enter" ? 13 : undefined);
			}
		},
	};

	Object.assign(window, { __KORI__ });

	ReactNativeWebView.postMessage(JSON.stringify({ connected: true }));
}
