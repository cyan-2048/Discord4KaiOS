<script>
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import MessageContent from "../components/MessageContent.svelte";
	import { changeStatusbarColor } from "../lib/helper";
	import { settings } from "../lib/shared";
	let text = "";
	onMount(() => {
		changeStatusbarColor("#2f3136");

		let keybind_jump = 0;

		settings.init.then(() => {
			const { keybinds } = get(settings);
			for (const key in keybinds) {
				const value = keybinds[key];
				if (value === "jump") keybind_jump = key;
			}
		});

		const array = [
			"Quickly edit your last sent message! Type 's/[what to replace]/[what to replace with]'.",
			`Press ${keybind_jump} at any point in message history to scroll to the latest.`,
			"This application is open-sourced at https://github.com/cyan-2048/Discord4KaiOS",
			"We have a dedicated Discord server for support on this application! Check it out in Settings.",
			"Don't ask for ETAs. No 'When will *something* arrive?'. We're all humans.",
			"never gonna give you up",
			"We're connecting to Discord's gateways to retrieve account info, server list and message history. Be patient!",
			"This app is a fork of Frank128's Discord-KaiOS-Unofficial.",
			"The app 99% only connects to discord's servers!",
			"The Discord API Docs gives you enough information to create your own Discord Client.",
		]; // wanna add something? just tell cyan in discord

		function random() {
			return array[Math.floor(Math.random() * array.length)];
		}

		const interval = setInterval(() => {
			text = random();
		}, 5000);

		text = random();

		// bruh i just realized i did a memory leak
		return () => clearInterval(interval);
	});
</script>

<div id="loading">
	<img src="/css/loading.png" alt />
	<div id="dyk">DID YOU KNOW</div>
	<div id="fact"><MessageContent content={text} /></div>
</div>

<svelte:window
	on:keydown={({ key }) => {
		if (key === "Backspace") window.close();
	}}
/>

<style lang="scss">
	%center-left-right {
		margin-left: auto;
		margin-right: auto;
	}

	#loading {
		width: 100vw;
		height: 100vh;
		position: absolute;
		display: flex;
		top: 0;
		left: 0;
		background-color: #2f3136;
		text-align: center;
		flex-direction: column;

		img {
			width: 200px;
			height: 200px;
			margin-top: auto;
			margin-bottom: 8px;
			display: inline-block;
			@extend %center-left-right;
		}
	}

	#dyk {
		font-size: 12px;
		margin-top: -35px;
		font-weight: 600;
		margin-bottom: 6px;
		line-height: 1.4;
	}
	#fact {
		font-size: 14px;
		height: 75px;
		width: 240px;
		padding: 0 6px;
		margin-bottom: auto;
		@extend %center-left-right;
	}
</style>
