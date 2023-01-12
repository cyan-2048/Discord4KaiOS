import localforage from "localforage";
import { get, readable, writable } from "svelte/store";

export const self = new Promise((res) => {
	const { mozApps } = navigator;
	if (!mozApps) return res(null);
	mozApps.getSelf().onsuccess = function () {
		res(this.result);
	};
});

function writableLF(name, defaultValue, checkUpdate = false, instance = null) {
	if (!instance) instance = localforage;
	let fromStorage = null;
	function _check() {
		if (fromStorage) {
			for (const key in defaultValue) {
				if (!(key in fromStorage)) {
					fromStorage[key] = defaultValue[key];
				}
			}
			for (const key in fromStorage) {
				if (!(key in defaultValue)) {
					delete fromStorage[key];
				}
			}
			instance.setItem(name, fromStorage);
			return fromStorage;
		} else {
			return { ...defaultValue };
		}
	}

	const _writable = writable(null);

	const init = (async () => {
		fromStorage = await instance.getItem(name);
		_writable.set((checkUpdate ? _check() : fromStorage) || defaultValue);
		_writable.subscribe((n) => {
			instance.setItem(name, n);
		});
	})();

	return { ..._writable, init };
}

export const settings = writableLF(
	"settings",
	{
		custom_rpc: false,
		prompt_delete: false,
		smooth_scroll: true,
		preserve_deleted: false,
		devmode: !PRODUCTION,
		keybinds: {
			"*": "edit",
			0: "jump",
			"#": "reply",
			1: "react",
			2: "pin",
			3: "delete",
		},
	},
	true
);

export const folderOpened = writableLF("folderOpened", {});

import sn from "./spatial_navigation";
sn.init();

export { sn };

export let pushOptions = writable(null);

export const uptime = readable(null, function start(set) {
	set(Math.floor(performance.now() / 1000));
	const interval = setInterval(() => {
		set(Math.floor(performance.now() / 1000));
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});

export const longpress = writable(false);

let longpress_timer = null;

window.addEventListener(
	"keydown",
	({ repeat }) => {
		if (get(longpress) === true || repeat) return;
		longpress_timer = setTimeout(() => {
			longpress.set(true);
		}, 400);
	},
	true
);

window.addEventListener(
	"keyup",
	() => {
		clearTimeout(longpress_timer);
		longpress.set(false);
	},
	true
);

// just so i can easily do development stuff
function writableObject(object) {
	return { ...writable(object), object };
}

export const serverProfiles = writableObject(new Map());
export const userProfiles = writableObject(new Map());

if (!PRODUCTION) {
	console.debug("serverProfiles", serverProfiles);
	console.debug("userProfiles", userProfiles);
}

export const queryProfiles = new Set();

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

export function observeElement(element) {
	return readable(false, (set) => {
		observed_elements.set(element, { ratio: null, set });
		observer.observe(element);

		return () => {
			observed_elements.delete(element);
			observer.unobserve(element);
		};
	});
}
