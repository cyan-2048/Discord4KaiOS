<script>
	import { createEventDispatcher, onMount } from "svelte";
	import { isChannelMuted, siftChannels }from "../lib/helper.js";
	import ServerMentions from "./ServerMentions.svelte";
	export let dm = false;
	export let discord;
	export let server;
	export let selected;
	export let serverAck;
	export let focusable = true;
	const dispatch = createEventDispatcher();

	let { id, roles, name, icon } = server || { id: null };

	let unread = false;
	let mentions = 0;

	let profile;
	let channels;
	let update = async () => {
		if (dm) {
		} else {
			if (!profile) profile = await discord.getServerProfile(id, discord.user.id);
			let raw = await discord.getChannels(id);
			channels = raw;
			let chs = siftChannels(raw, roles, profile, true).filter((l) => !isChannelMuted(discord, { id: l.id }, id));
			let state = chs.map((h) => discord.cache.read_state.find((j) => j.id == h.id));
			let state_ur = state.map((g) => (g || {}).last_message_id);
			let current = chs
				.map((g) => (g || {}).last_message_id)
				.map((f, i) => {
					if (!state_ur[i]) return;
					if (!f) state_ur[i] = f;
					return f;
				});

			let muted = discord.cache.user_guild_settings.find((a) => a.guild_id == id);
			if (muted && muted.muted == true) unread = false;
			else unread = JSON.stringify(state_ur) != JSON.stringify(current);
			mentions = state.reduce((a, b) => a + (b || {}).mention_count || 0, 0);
		}
	};

	onMount(update);
	serverAck.on("update", (d) => {
		if (channels?.find((e) => e.id == d.channel_id)) update();
		if (d.channel_overrides?.find((g) => channels?.find((e) => e.id == g.channel_id))) update();
	});

	let shorten = (e) =>
		e
			?.split(" ")
			.map((a) => a[0])
			.join("")
			.slice(0, 3) || "";

	let main;
</script>

<main
	data-mentions={mentions}
	on:click={() => dispatch("select", { id })}
	data-focusable={focusable ? "" : null}
	class="{unread ? 'unread' : ''} {dm ? 'dm' : ''} {selected ? 'selected' : ''}"
	tabindex="0"
	bind:this={main}
>
	{#if focusable}
		<div class="hover" />
	{/if}
	{#if icon}
		<img class="image" src="https://cdn.discordapp.com/icons/{id}/{icon}.png?size=48" alt={shorten(name)} />
	{:else}
		<div class="image">{shorten(name)}</div>
	{/if}
	{#if mentions > 0 && focusable}
		<ServerMentions color={main?.parentNode.matches("[data-folder]") && "#2f3136"}>{mentions}</ServerMentions>
	{/if}
</main>

<style>
	:focus div.image,
	:hover div.image,
	.selected div.image {
		background-color: rgb(88, 101, 242);
	}

	.dm .image {
		background-image: url(/css/dms.png);
		background-size: 100%;
	}
	main:not(:last-child) {
		margin-bottom: 8px;
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
		transition: height 0.3s ease, opacity 0.3s ease;
	}
	.selected *::after,
	.unread *::after,
	:focus *::after,
	:hover *::after {
		opacity: 1;
	}
	:hover .hover::after,
	:focus .hover::after {
		height: 25px;
	}
	.selected .hover::after {
		height: 100% !important;
	}
	main,
	.image {
		width: 48px;
		height: 48px;
		position: relative;
	}
	.image {
		font-size: 13px;
		text-align: center;
		line-height: 45px;
		overflow: hidden;
		border-radius: 50% !important;
		transition: border-radius 0.3s linear, background-color linear 0.2s;
	}
	.selected .image,
	:hover .image,
	:focus .image {
		border-radius: 30% !important;
	}
	div.image {
		background-color: rgb(54, 57, 63);
	}
</style>
