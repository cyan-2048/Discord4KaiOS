import "core-js/actual/array/flat";
import "core-js/actual/array/find-last";
import "core-js/actual/string/match-all";
import manifest from "./assets/manifest.json";
import App from "./App.svelte";
import scrollBy from "./lib/scrollBy";
import { navigate } from "svelte-routing";
import { self } from "./lib/shared";
import * as helper from "./lib/helper";

//polyfill
scrollBy();
navigate("/", { replace: true });

document.documentElement.lang = navigator.language;

async function init() {
	new App({
		target: document.body,
	});

	if (PRODUCTION) {
		const _self = await self;
		if (_self !== null)
			for (const key in manifest) {
				if (typeof manifest[key] === "string" && _self.manifest[key] !== manifest[key]) {
					alert("cannot guarantee the authenticity of this app!");
					alert("Beware of using this app! Your token may be compromised.");
					alert("only install the app from here: https://notabug.org/cyan-2048/Discord4KaiOS_rewrite");
					alert("most people who distribute this app claim it's their own creation and do not credit the original");
					alert(":(");
					return;
				}
			}

		function _async(generator, __arguments = null, __this) {
			return new Promise((resolve, reject) => {
				var fulfilled = (value) => {
					try {
						step(generator.next(value));
					} catch (e) {
						reject(e);
					}
				};
				var rejected = (value) => {
					try {
						step(generator.throw(value));
					} catch (e) {
						reject(e);
					}
				};
				var step = (x) => (x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected));
				step((generator = generator.apply(__this, __arguments)).next());
			});
		}

		window.async = function (generator, _arguments) {
			_async(generator, _arguments, this);
		};
	} else {
		function softkey(e) {
			const { target, key, bubbles, cancelable, repeat, type } = e;
			if (!/Left|Right/.test(key) || !key.startsWith("Arrow") || !e.ctrlKey) return;
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
			target.dispatchEvent(new KeyboardEvent(type, { key: "Soft" + key.slice(5), bubbles, cancelable, repeat }));
		}

		document.addEventListener("keyup", softkey, true);
		document.addEventListener("keydown", softkey, true);

		Object.assign(window, helper);
	}
}

init();
