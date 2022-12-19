<script>
	import "./assets/global.css";
	import { onMount } from "svelte";

	import { settings, pushOptions } from "./lib/shared";
	import { init, localStorage } from "./lib/database";

	import { Router, Route, navigate } from "svelte-routing";
	import Channels from "./routes/Channels.svelte";
	import Messages from "./routes/Messages.svelte";
	import Loading from "./routes/Loading.svelte";
	import Login from "./routes/Login.svelte";
	import About from "./routes/About.svelte";
	import ImageViewer from "./modals/ImageViewer.svelte";
	import Options from "./modals/Options.svelte";
	import Settings from "./routes/Settings.svelte";
	import markdown from "./lib/discord-markdown";
	import Privacy from "./routes/Privacy.svelte";

	window.markdown = markdown;

	let loaded = false;

	!(function () {
		let supported = false;
		document.createElement("i").focus({
			get preventScroll() {
				supported = true;
			},
		});
		if (!supported) {
			const original = HTMLElement.prototype.focus;
			Element.prototype.focus = HTMLElement.prototype.focus = function (options) {
				if (options?.preventScroll) {
					const map = [];
					let p = this;
					while ((p = p.parentNode)) map.push([p, p.scrollLeft, p.scrollTop]);
					original.call(this);
					map.forEach(function ([el, x, y]) {
						if (el.scrollLeft !== x) el.scrollLeft = x;
						if (el.scrollTop !== y) el.scrollTop = y;
					});
				} else {
					original.call(this);
				}
			};
		}
	})();

	onMount(async () => {
		await settings.init;
		if ($settings.devmode) {
			window.navigate = navigate;
			window.localStorage = localStorage;
		}
		window.changeSettings = (e) => ($settings = { ...$settings, ...e });
		loaded = await init();
	});

	let _done = null;
</script>

<svelte:window
	on:keydown|capture={(e) => {
		const { key, target } = e;
		if (key === "Backspace") {
			if ("value" in target) {
				if (target.value !== "") {
					// kaios behavior, backspace will not be emitted
					e.stopImmediatePropagation();
					e.stopPropagation();
				} else {
					e.preventDefault();
				}
			} else e.preventDefault();
		}
	}}
/>

<Router url="">
	<Route primary={false} path="/login">
		<Login bind:_done />
	</Route>
	{#if loaded}
		<Route primary={false} preserve={true} path="channels/:guildID" let:writable let:params>
			<Channels _guildID={params.guildID} />
		</Route>
		<Route primary={false} preserve={true} path="channels/:guildID/:channelID" let:writable let:params>
			<Messages mounted={writable} {...params} />
		</Route>
		<Route primary={false} path="/settings">
			<Settings {settings} />
		</Route>
	{:else if _done === null}
		<Loading />
	{/if}
	<Route primary={false} path="/about">
		<About />
	</Route>
	<Route primary={false} path="/privacy">
		<Privacy />
	</Route>
</Router>
<Options bind:push={$pushOptions} />
