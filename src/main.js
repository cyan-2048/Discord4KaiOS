import App from "./App.svelte";
import polyfill from "./lib/scrollBy.js";
polyfill();

document.documentElement.lang = navigator.language;

function softkey(e) {
	let { target, key, shiftKey, bubbles, cancelable, repeat, type } = e;
	if (!/Left|Right/.test(key) || !key.startsWith("Arrow") || !shiftKey) return;
	e.stopImmediatePropagation();
	e.stopPropagation();
	e.preventDefault();
	target.dispatchEvent(new KeyboardEvent(type, { key: "Soft" + key.slice(5), bubbles, cancelable, repeat }));
}


window.addEventListener("keydown", (e) => {
	const { target, key } = e;
	if (key === "Backspace" && (!("value" in target) || target.value === "")) e.preventDefault();
});
document.addEventListener("keyup", softkey);
document.addEventListener("keydown", softkey);

const app = new App({
	target: document.body,
});

!PRODUCTION && (window.app = app);

export default app;
