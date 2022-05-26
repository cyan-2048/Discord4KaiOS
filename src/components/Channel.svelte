<script>
	export let avatar = null;
	export let ch_type = "text";
	export let id = null;
	export let guildID;
	export let serverAck;
	export let discord;
	export let recipients;
	export let dm = false;
	export let last_message_id;
	export let name = null;

	import { createEventDispatcher, onMount, onDestroy } from "svelte";
	import { centerScroll, isChannelMuted, shuffle } from "../lib/helper";
	const dispatch = createEventDispatcher();

	let onClick = () => {
		dispatch("select", { id });
	};

	let mentions = 0;
	let unread = false;
	let muted = false;

	let change = () => {
		muted = isChannelMuted(discord, { id }, guildID);
		if (guildID) {
			if (muted) unread = false;
			let el = discord.cache.read_state.find((e) => e.id == id);
			if (el) {
				if (!muted) unread = last_message_id ? el.last_message_id != last_message_id : false;
				mentions = el.mention_count;
			}
		}
	};

	let update = (d) => {
		if (d.channel_id == id) {
			last_message_id = d.last_message_id;
			change();
		}
		let override = d.channel_overrides?.find((a) => a.channel_id == id);
		if (override || muted) {
			change();
		}
	};

	let subtext;
	let status;
	let client;

	function decideClient(clientsObj) {
		let clone = { ...clientsObj };
		Object.keys(clone).forEach((a) => {
			if (a === client) return delete clone[a];
			if (clone[a] !== status) return delete clone[a];
		});
		if (Object.keys(clone).length > 0) {
			return shuffle(Object.keys(clone))[0];
		} else return client;
	}

	let onStatus = (d) => {
		if (recipients?.length !== 1) return;
		let p;
		if (d) {
			if (d.user?.id === recipients[0].id) status = d.status;
		} else {
			let found = discord.cache.guilds.find((a) => a.presences.find((e) => (e.user.id === recipients[0].id ? (p = e) : false)));
			if (found) status = p.status;
		}
		if (!status) status = "offline";
		else client = decideClient((d || p).client_status);
	};

	onMount(change);
	serverAck.on("update", update, "ch" + id);
	if (dm) {
		subtext = recipients.length > 1 ? recipients.length + " Members" : null;
		onStatus();
		serverAck.on("status", onStatus, "ch" + id);
	}

	onDestroy(() => {
		serverAck.off("update", update, "ch" + id);
		if (dm) serverAck.off("status", onStatus, "ch" + id);
	});

	function onFocus() {
		setTimeout(() => centerScroll(this), 50);
	}
</script>

<main
	data-focusable
	on:focus={onFocus}
	on:click={onClick}
	tabindex="0"
	class="{avatar ? 'dm' : ''} {muted && mentions == 0 ? 'muted' : ''} {(unread && !muted) || mentions > 0 ? 'unread' : ''}"
>
	{#if avatar}
		<div class="avatar">
			<img src={avatar} alt="" />
			{#if status}
				<div
					class="status {client === 'mobile' && status !== 'offline' ? 'mobile' : ''}"
					style="background-image:url(/css/status/{status !== 'offline' ? client + '_' : ''}{status}.png);"
				/>
			{/if}
		</div>
	{:else}
		<div class="bar" />
		<img class="ch_type{mentions > 0 || unread ? ' bright' : ''}" src="/css/channels/{ch_type}.svg" alt />
	{/if}
	{#if !isNaN(mentions) && mentions > 0}
		<div class="mentions">
			<div class={String(mentions).length > 2 ? "flow" : ""}>{mentions}</div>
		</div>
	{/if}
	{#if subtext}
		<div class="subtext">{subtext}</div>
	{/if}
	<div class="text">
		{#if name}{name}
		{:else}
			<slot />
		{/if}
	</div>
</main>

<style>
	main:last-child {
		margin-bottom: 6.5px;
	}
	main:first-child {
		margin-top: 6.5px;
	}
	img {
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: optimizespeed;
	}

	.bar {
		width: 10px;
		height: 100%;
		display: grid;
		align-items: center;
		left: -15px;
	}

	.mobile {
		height: 21px !important;
		border-radius: 18% !important;
	}

	.bar::after {
		content: "";
		display: block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: transparent;
	}

	.unread .bar::after {
		background-color: white;
	}

	.mentions,
	.subtext,
	.text,
	.avatar,
	.status,
	.ch_type,
	.bar {
		position: absolute;
	}
	.bright {
		filter: brightness(2);
	}
	.status {
		background-size: 11px;
		background-repeat: no-repeat;
		background-position: 2.9px;
		width: 16px;
		height: 16px;
		border-radius: 100%;
		bottom: 5px;
		right: 0;
		background-color: #2f3136;
	}

	.ch_type {
		width: 20px;
		height: 100%;
		object-fit: contain;
		left: 6px;
	}

	.avatar {
		top: 5px;
		left: 5px;
	}

	.avatar img {
		width: 32px;
		height: 32px;
		border-radius: 100%;
		object-fit: contain;
	}
	.mentions {
		width: fit-content;
		min-width: 16px;
		height: 100%;
		right: 10px;
		display: grid;
		place-items: center;
	}

	.flow {
		padding: 0 3px;
	}
	.subtext {
		bottom: 6px;
		left: 50px;
		font-size: 11px;
	}
	.subtext + .text {
		top: 3px !important;
	}
	.mentions > div {
		display: block;
		width: fit-content;
		min-width: 16px;
		height: 16px;
		background-color: #ed4245;
		border-radius: 8px;
		font-size: 10px;
		text-align: center;
		color: white;
	}

	main {
		width: calc(100vw - 20px);
		margin-left: 10px;
		border-radius: 5px;
		position: relative;
		margin-bottom: 2px;
		height: 32px;
	}

	.text {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	main:not(.dm) .text {
		left: 32px;
		font-size: 14px;
		top: 0;
		height: 100%;
		vertical-align: middle;
		width: calc(100vw - 6rem);
		line-height: 32px;
	}

	.dm {
		height: 42px !important;
	}
	.dm .text {
		font-size: 15px;
		top: 10.5px;
		left: 50px;
		width: calc(100vw - 80px);
	}
	main > * {
		color: #72767d;
	}
	:focus > *,
	.unread > * {
		color: white !important;
	}
	.muted {
		opacity: 0.7;
	}
	.muted > * {
		color: #4f545c;
	}
	.muted:focus {
		opacity: 1;
	}
	main:focus,
	main:focus .status {
		background-color: #393c42;
	}
</style>
