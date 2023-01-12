<script>
	// js imports
	import { discord, isServerOwner, serverAck } from "../lib/database";

	import { onDestroy, onMount } from "svelte";
	import { isChannelMuted, isGuildMuted, navigate, siftChannels, xhr } from "../lib/helper.js";
	import ServerMentions from "./ServerMentions.svelte";
	import { serverProfiles } from "../lib/shared";
	import { eventHandler } from "../lib/EventEmitter";
	export let dm = false;
	export let server = null;
	export let selected;
	export let focusable = true;

	$: id = server?.id || "@me";
	$: roles = server?.roles || [];
	$: name = server?.name;
	$: icon = server?.icon;

	$: console.error(server);

	let unread = false;
	let mentions = 0;

	let channel_ids = [];
	let update = async () => {
		if (dm) {
		} else {
			const raw = await discord.getChannels(id);

			const serverProfile = $serverProfiles.get(id + "/" + discord.user.id) || (await discord.getServerProfile(id, discord.user.id));

			const sifted = siftChannels(raw, roles, serverProfile, await isServerOwner(id), true);
			channel_ids = sifted.map((channel) => channel.id);

			mentions = 0;
			unread = false;

			const guildMuted = isGuildMuted(discord, id);

			for (const state of discord.cache.read_state) {
				if (!channel_ids.includes(state.id)) continue;
				if (state.mention_count > 0) {
					mentions += Number(state.mention_count);
				}
				if (!unread && !guildMuted) {
					const channelWithID = sifted.find((channel) => channel.id === state.id)?.last_message_id;
					if (channelWithID && state.last_message_id !== channelWithID) {
						unread = true;
					}
				}
			}
		}
	};

	onMount(update);

	const shorten = (e) =>
		e
			?.split(" ")
			.map((a) => a[0])
			.join("")
			.slice(0, 3) || "";

	let main;

	onDestroy(
		eventHandler(serverAck, "update", (event) => {
			const d = event?.detail;
			if (channel_ids.includes(d.channel_id)) update();
			if (d.channel_overrides?.find((g) => channel_ids.includes(g.channel_id))) update();
		})
	);

	let focused = false;
	let animated = null;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<main
	class="Server-svelte"
	data-mentions={mentions}
	on:click={() => {
		navigate("/channels/" + id);
	}}
	on:blur={() => void (focused = false)}
	on:focus={async () => {
		focused = true;
		if (animated !== null) return;
		if (animated || server?.features?.includes("ANIMATED_ICON")) {
			const e = await xhr(`https://cdn.discordapp.com/icons/${id}/${icon}.gif?size=16`);
			animated = e !== "";
		} else {
			animated = false;
		}
	}}
	data-focusable={focusable ? "" : null}
	class:unread
	class:dm
	class:selected
	tabindex="0"
	bind:this={main}
>
	{#if focusable}
		<div class="hover" />
	{/if}
	{#if icon}
		<div class="image" style:--image="url(https://cdn.discordapp.com/icons/{id}/{icon}.{focused && animated ? "gif" : "png"}?size=48)" />
	{:else}
		<div class="image" data-name={shorten(name)} />
	{/if}
	{#if mentions > 0 && focusable}
		<ServerMentions>{mentions}</ServerMentions>
	{/if}
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	.Server-svelte {
		&:not(:last-child) {
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
			@include linearGradient(10%, rgba(234, 234, 234));
			background-color: rgba(155, 155, 155);
			border: 1px solid black;
			box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.3), inset 0 0 0 1px white;
			width: 10px;
			border-radius: 80px;
			display: block;
			height: 10px;
			opacity: 0;
			/*transition: height 0.3s ease, opacity 0.3s ease;*/
		}
		&.selected,
		&.unread,
		&:focus {
			*::after {
				opacity: 1;
			}
		}

		&:focus .hover::after {
			height: 25px;
		}

		&.selected .hover::after {
			height: 100% !important;
		}

		&,
		.image {
			width: 48px;
			height: 48px;
			position: relative;
		}

		.image {
			overflow: hidden;
			box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.6);

			&,
			&::before,
			&::after {
				border-radius: 50%;
				transition: border-radius 0.2s linear, background-color linear 0.2s;
			}

			&::before,
			&::after {
				width: 100%;
				height: 100%;
				top: 0;
				left: 0;
				position: absolute;
			}

			font-size: 13px;
			text-align: center;
			line-height: 45px;

			&::before {
				content: "";
			}

			&::after {
				content: attr(data-name);
				background-image: var(--image);
				box-shadow: inset 0 0 0 1px rgba(230, 230, 230, 0.8), inset 0 0 0 2px rgba(0, 0, 0, 0.6) !important;
			}
		}

		&:focus,
		&.selected {
			.image {
				--bg-color: #5865f2;
				--gradient-color: rgba(32, 42, 65);
			}
		}

		.image::before {
			content: "";
			@include linearGradient(5%, var(--gradient-color, rgb(36, 36, 38)));
		}

		&.dm .image::after {
			--image: url(/css/dms.png) !important;
			background-size: 100%;
		}

		&:focus,
		&.selected {
			.image {
				background-color: var(--bg-color, rgba(67, 69, 74));
			}
			.image,
			.image::after,
			.image::before {
				border-radius: 7px !important;
			}
		}
	}
</style>
