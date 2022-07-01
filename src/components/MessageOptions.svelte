<script>
	import { createEventDispatcher, onDestroy, onMount, tick } from "svelte";
	import { dblclick, delay, customDispatch } from "../lib/helper";
	const dispatch = createEventDispatcher();
	import { discord, sn } from "../lib/shared";
	import Options from "./Options.svelte";

	export let channelPermissions;
	export let message;
	export let channel;
	export let el;

	const userMessage = message.author.id === discord.user.id;
	const manageMessage = channelPermissions.manage_messages === true;

	onMount(() => {
		if (!(userMessage || manageMessage || channel.dm || channelPermissions.write !== false)) {
			dispatch("close");
			return;
		}
	});

	let selected = null;

	$: if (selected !== null) dispatch("close");

	onDestroy(async () => {
		await tick();
		await delay(20); // delay because keydown enter gets dispatched
		if (selected !== null) {
			switch (selected) {
				case 0:
					dblclick(el);
					break;
				case 1:
					alert("not implemented!");
					break;
				case 2:
					customDispatch(el, "reply");
					break;
				case 3:
					customDispatch(el, "delete");
					break;
			}
		}
		if (selected !== 0 || selected !== 2) {
			sn.focus("messages");
		}
	});
</script>

<Options on:close>
	{#if userMessage && !el.querySelector("[data-sticker]")}
		<div on:click={() => (selected = 0)} tabindex="0">
			Edit Message
			<svg data-name="Pencil" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
				<path
					fillrule="evenodd"
					cliprule="evenodd"
					d="M19.2929 9.8299L19.9409 9.18278C21.353 7.77064 21.353 5.47197 19.9409 4.05892C18.5287 2.64678 16.2292 2.64678 14.817 4.05892L14.1699 4.70694L19.2929 9.8299ZM12.8962 5.97688L5.18469 13.6906L10.3085 18.813L18.0201 11.0992L12.8962 5.97688ZM4.11851 20.9704L8.75906 19.8112L4.18692 15.239L3.02678 19.8796C2.95028 20.1856 3.04028 20.5105 3.26349 20.7337C3.48669 20.9569 3.8116 21.046 4.11851 20.9704Z"
					fill="currentColor"
				/>
			</svg>
		</div>
	{/if}
	{#if manageMessage || channel.dm}
		<div on:click={() => (selected = 1)} tabindex="0">
			Pin Message
			<svg data-name="Pin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M22 12L12.101 2.10101L10.686 3.51401L12.101 4.92901L7.15096 9.87801V9.88001L5.73596 8.46501L4.32196 9.88001L8.56496 14.122L2.90796 19.778L4.32196 21.192L9.97896 15.536L14.222 19.778L15.636 18.364L14.222 16.95L19.171 12H19.172L20.586 13.414L22 12Z"
				/>
			</svg>
		</div>
	{/if}
	{#if channelPermissions.write !== false}
		<div on:click={() => (selected = 2)} tabindex="0">
			Reply
			<svg data-name="Reply" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
				<path
					d="M10 8.26667V4L3 11.4667L10 18.9333V14.56C15 14.56 18.5 16.2667 21 20C20 14.6667 17 9.33333 10 8.26667Z"
					fill="currentColor"
				/>
			</svg>
		</div>
	{/if}
	{#if userMessage || manageMessage}
		<div on:click={() => (selected = 3)} style:color="rgb(237, 66, 69)" tabindex="0">
			Delete Message
			<svg data-name="Trash" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
				<path fill="currentColor" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z" />
				<path
					fill="currentColor"
					d="M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z"
				/>
			</svg>
		</div>
	{/if}
</Options>
