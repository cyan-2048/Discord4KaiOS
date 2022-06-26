<script>
	// components
	import Server from "./Server.svelte";
	import ServerMentions from "./ServerMentions.svelte";

	// js imports
	import { serverAck, discord } from "../lib/shared";
	import { onMount } from "svelte";
	import { decimal2rgb } from "../lib/helper";

	export let guild, color, id, name, type;
	export let servers = [];
	//	export let name;
	let mentions = 0;
	let unread = false;
	let open = true;
	let main;

	//	console.log("server color",name, color)

	let update = () => {
		unread = !!main.querySelector(".unread");
		mentions = [...main.querySelectorAll("[data-mentions]")]
			.map((a) => Number(a.dataset.mentions) || 0)
			.reduce((a, b) => a + b, 0);
	};

	function toggleOpen(e) {
		if (this !== e.target) return;
		open = !open;
		update();
		setTimeout(() => (!open ? main && main.focus() : main && main.querySelector("[data-focusable]")?.focus()), 50);
	}
	onMount(update);
	serverAck.on("update", () => setTimeout(update, 50));
</script>

<main
	{id}
	data-type={type}
	data-name={name}
	tabindex="0"
	on:click={toggleOpen}
	bind:this={main}
	style={!open ? `background-color: rgba(${color ? decimal2rgb(color, true) : [88, 101, 242]},0.3)` : null}
	data-focusable={open ? null : ""}
	data-folder
	class="{open ? 'open' : ''} {unread ? 'unread' : ''}"
>
	<div class="hover" />
	{#if open}
		<div on:click={toggleOpen} tabindex="0" data-focusable class="folder-toggle">
			<div class="hover" />
		</div>
	{/if}
	{#each servers as server (server.id)}
		<Server focusable={open} on:select selected={guild?.id === server.id} {server} />
	{/each}
	{#if mentions > 0 && !open}
		<ServerMentions color="#202225">{mentions}</ServerMentions>
	{/if}
</main>

<style>
	main {
		position: relative;
		margin-bottom: 8px;
	}
	main:not(.open),
	.folder-toggle {
		width: 48px;
		height: 48px;
		position: relative;
	}
	main:not(.open) {
		border-radius: 35%;
	}
	main:last-child {
		margin-bottom: 0;
	}
	main.open {
		background-color: #2f3136;
		border-radius: 25px;
	}
	.folder-toggle {
		margin-bottom: 8px;
		background-size: cover;
		background-image: url(/css/folder.png) !important;
		image-rendering: pixelated;
		image-rendering: optimizeSpeed;
	}
	.hover {
		position: absolute;
		height: 100%;
		width: 10px;
		left: -17px;
		display: grid;
		align-items: center;
	}
	.hover::after {
		content: "";
		background-color: white;
		width: 10px;
		border-radius: 80px;
		display: block;
		height: 10px;
		opacity: 0;
	}
	:not(.open) > .hover::after {
		transition: height 0.3s ease, opacity 0.3s ease;
	}
	:not(.open):focus > .hover::after {
		opacity: 1;
		height: 25px;
	}
	.unread:not(.open) .hover::after {
		opacity: 1;
	}
</style>
