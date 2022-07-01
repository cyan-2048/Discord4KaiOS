import { writable } from "svelte/store";

export const settings = writable(
	(() => {
		const defaultSettings = {
			custom_rpc: true,
			prompt_delete: false,
			keybinds: {
				"*": "edit",
				0: "jump",
				"#": "reply",
				1: "react",
				2: "pin",
				3: "delete",
			},
		};
		let fromStorage = localStorage.settings;
		if (fromStorage) {
			fromStorage = JSON.parse(fromStorage);
			for (const key in defaultSettings) {
				if (!(key in fromStorage)) {
					fromStorage[key] = defaultSettings[key];
				}
			}
			for (const key in fromStorage) {
				if (!(key in defaultSettings)) {
					delete fromStorage[key];
				}
			}
			localStorage.settings = JSON.stringify(fromStorage);
			return fromStorage;
		} else {
			return { ...defaultSettings };
		}
	})()
);

settings.subscribe((n) => {
	localStorage.settings = JSON.stringify(n);
});

export function createTimer(seconds) {
	if (typeof seconds !== "number") throw TypeError("not a number");
	if (seconds < 1) throw RangeError("the timer should at least be one second");

	let secondsLeft = Math.round(seconds);

	const { subscribe, set, update } = writable(secondsLeft);

	let pending = false;

	subscribe((value) => {
		if (pending) return;
		pending = true;
		setTimeout(function tick() {
			if (value !== 0) {
				update((n) => n - 1);
				pending = false;
			}
		}, 1000);
	});

	return { subscribe, set, update };
}

export function time() {
	return readable(null, (set) => {
		// the update function sets the latest date
		const update = () => set(new Date());

		// force an update to initialize the store with a non-null value
		update();

		// setup an interval timer to update the store's value repeatedly over time
		const interval = setInterval(update, 1000);

		// return unsubscribe callback:
		// it will stop the timer when the store is destroyed
		return () => clearInterval(interval);
	});
}
