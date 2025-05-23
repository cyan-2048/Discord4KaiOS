import localforage from "localforage";

import { toast } from "./views/modals/toast.ts";

/* @refresh reload */
import { render } from "solid-js/web";

import "./styles.scss";
import App from "./App";

import "./lib/scrollBy";

window.onerror = (...args) => {
	const error = args[4];
	console.error(...args);
	if (error && typeof window !== "undefined") {
		if ("__reportError__" in window && typeof window.__reportError__ === "function") {
			window.__reportError__(error);
		}
	}
};

render(() => <App />, document.body);

setTimeout(() => {
	document.querySelector(".LOADING")?.remove();
}, 100);

if (import.meta.env.DEV) {
	import("./dev.ts");
} else {
	document.addEventListener("keydown", (e) => {
		if (e.key === "Backspace") {
			e.preventDefault();
		}
	});
}

const isKai3 = import.meta.env.KAIOS == 3;

if (import.meta.env.DEV) {
	const manifest = import.meta.env.MANIFEST;
	const version = isKai3 ? manifest.b2g_features.version : manifest.version;

	toast("you are running " + version);
}

if (import.meta.env.PROD) {
	const manifestURL = isKai3 ? "/manifest.webmanifest" : "/manifest.webapp";

	fetch(manifestURL).then(async (m) => {
		const manifest = await m.json();
		const version = isKai3 ? manifest.b2g_features.version : manifest.version;

		// VERSION EMOJI
		toast("you are running " + version + " 🌌");
	});
}

Object.assign(window, { localforage });
