<script>
	import { createEventDispatcher, onMount } from "svelte";
	import { delay } from "../lib/helper";
	const dispatch = createEventDispatcher();
	import { discord, sn } from "../lib/shared";

	export let channelPermissions;
	export let message;
	export let channel;
	export let el;

	let closing = false;

	const userMessage = message.author.id === discord.user.id;
	const manageMessage = channelPermissions.manage_messages === true;

	onMount(() => {
		if (!(userMessage || manageMessage || channel.dm || channelPermissions.write !== false)) {
			dispatch("close");
			return;
		}
		sn.focus("message-opts");

		async function close() {
			closing = true;
			await delay(300);
			sn.focus("messages");
			dispatch("close");
		}

		function onkeydown({ target, key }) {
			if (key === "Enter") {
				target.click();
			}
			if (key === "Backspace") {
				close();
			}
		}
		window.addEventListener("keydown", onkeydown);
		return () => {
			window.removeEventListener("keydown", onkeydown);
		};
	});
</script>

<main class:closing data-msg-options>
	{#if userMessage}
		<div tabindex="0">Edit Message</div>
	{/if}
	{#if manageMessage || channel.dm}
		<div tabindex="0">Pin Message</div>
	{/if}
	{#if channelPermissions.write !== false}
		<div tabindex="0">Reply</div>
	{/if}
	{#if userMessage || manageMessage}
		<div tabindex="0">Delete Message</div>
	{/if}
</main>

<style>
	.closing {
		bottom: -100vh;
	}

	main {
		width: calc(100vw - 10px);
		position: absolute;
		bottom: 5px;
		left: 5px;
		padding: 8px;
		background-color: #18191c;
		z-index: 3;
		animation: opening 0.3s ease;
		transition: bottom ease 0.3s;
		border-radius: 5px;
	}
	main > div {
		height: 32px;
		user-select: none;
		border-radius: 3px;
		line-height: 2;
		padding: 0 7px;
	}
	main > div:focus {
		background-color: #4752c4;
	}

	@keyframes opening {
		from {
			bottom: -100vh;
		}
		to {
			bottom: 5px;
		}
	}
</style>
