<script>
	import { onMount } from "svelte";
	import Server from "./Server.svelte";
	export let discordGateway;
	export let discord;
	export let servers = [];
	let mentions = 0;
	let unread = false;
	let open = true;
	let folder;

	let update = () => {
		unread = !!folder.querySelector(".unread");
		mentions = [...folder.querySelectorAll("[data-mentions]")].map((a) => Number(a.dataset.mentions) || 0).reduce((a, b) => a + b, 0);
	};

	onMount(update);
</script>

<main data-focusable={open ? null : ""} bind:this={folder} data-folder class={open ? "open" : ""}>
	{#each servers as server, i}
		<Server {discord} {discordGateway} {server} on:update={update} on:select} />
	{/each}
</main>

<style>
</style>
