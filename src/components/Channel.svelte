<script>
	// js imports
	import { serverAck, discord } from "../lib/database";
	import { onMount } from "svelte";
	import { centerScroll, isChannelMuted, isGuildMuted, navigate, shuffle } from "../lib/helper";

	import ChannelText from "../icons/ChannelText.svelte";
	import ChannelTextLimited from "../icons/ChannelTextLimited.svelte";
	import Announce from "../icons/Announce.svelte";
	import { multipleEventHandler } from "../lib/EventEmitter";
	import { snackbar } from "../modals";

	export let avatar = null;
	export let ch_type = "text";
	export let id = null;
	export let guildID;
	export let recipients = [];
	export let dm = false;
	export let name = null;

	let mentions = 0;
	let unread = false;
	let muted = false;

	let subtext;
	let status;
	let client;

	let main;

	onMount(() => {
		let last_message_id = $$props.last_message_id;

		function change() {
			muted = isChannelMuted(discord, id, guildID === "@me" ? null : guildID);
			if (guildID !== "@me") {
				unread = false;
				mentions = 0;
				if (!muted && last_message_id !== null)
					for (const state of discord.cache.read_state) {
						if (state.id === id) {
							if (state.mention_count > 0) {
								mentions += Number(state.mention_count);
							}
							if (!unread && !isGuildMuted(discord, id)) {
								if (state.last_message_id !== last_message_id) {
									unread = true;
								}
							}
							break;
						}
					}
			}
		}

		change();

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

		function makeSubtext(d) {
			let s = d.activities?.find((a) => a.type === 4);
			if (s) subtext = s.state;
		}

		const onStatus = (event) => {
			const d = event?.detail;

			if (recipients?.length !== 1) return;
			if (d && d.user?.id !== recipients[0].id) return;
			let p;
			if (d) {
				status = d.status;
			} else {
				let found = discord.cache.guilds.find((a) => a.presences.find((e) => (e.user.id === recipients[0].id ? (p = e) : false)));
				if (found) status = p.status;
			}
			if (!status) status = "offline";
			else {
				makeSubtext(d || p);
				client = decideClient((d || p).client_status);
			}
		};

		if (dm) {
			subtext = recipients.length > 1 ? recipients.length + 1 + " Members" : null;
			onStatus();
		}

		return multipleEventHandler(serverAck, {
			update: async function ({ detail: d }) {
				if (d.channel_id === id) {
					last_message_id = (await discord.getChannel(id)).last_message_id;
					change();
				} else if (d.channel_overrides?.find((a) => a.channel_id == id) || muted) {
					change();
				}
			},
			status: dm && onStatus,
		});
	});
</script>

<main
	bind:this={main}
	data-focusable
	on:click={async () => {
		const { last_message_id } = await discord.getChannel(id);
		if (last_message_id) navigate(`/channels/${guildID}/` + id);
		else snackbar("channel has no messages");
	}}
	tabindex="0"
	id="channel{id}"
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
		<svelte:component this={{ text: ChannelText, limited: ChannelTextLimited, announce: Announce }[ch_type]} />
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

<style lang="scss">
	@use "../assets/shared" as *;

	main {
		width: calc(100vw - 20px);
		margin-left: 10px;
		border-radius: 5px;
		position: relative;
		margin-bottom: 2px;
		height: 32px;

		&:last-child {
			margin-bottom: 6.5px;
		}
		&:first-child {
			margin-top: 6.5px;
		}

		.text {
			font-weight: 600;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		&:not(.dm) .text {
			left: 32px;
			font-size: 14px;
			top: 0;
			height: 100%;
			vertical-align: middle;
			width: calc(100vw - 4rem);
			line-height: 32px;
		}

		> :global(*) {
			color: #72767d;
		}
		&:focus > :global(*),
		&.unread > :global(*) {
			color: white !important;
		}

		&:focus {
			@extend %focus;
		}

		&:focus .status {
			background-color: #393c42;
		}

		:global(svg) {
			width: 20px;
			height: 100%;
			object-fit: contain;
			left: 6px;
		}
	}

	.muted:not(:focus) .avatar {
		opacity: 0.5;
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
	main :global(svg),
	.bar {
		position: absolute;
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

	.avatar {
		top: 5px;
		left: 5px;

		img {
			width: 32px;
			height: 32px;
			border-radius: 100%;
			object-fit: contain;
		}
	}

	.mentions {
		width: fit-content;
		min-width: 16px;
		height: 100%;
		right: 8px;
		display: flex;
		align-items: center;

		> div {
			display: block;
			width: fit-content;
			min-width: 19px;
			height: 19px;
			border-radius: 10px;
			font-size: 12px;
			text-align: center;
			color: white;
			font-weight: 600;
			padding: 0 4px;

			background: linear-gradient(0deg, transparent 22%, rgba(217, 79, 77) 100%) !important;
			border: 1px solid rgba(230, 230, 230, 0.6);
			box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.5);
			background-color: rgba(158, 58, 56) !important;
		}
	}

	.flow {
		padding: 0 3px;
	}

	.subtext {
		bottom: 6px;
		left: 50px;
		font-size: 11px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 160px;

		+ .text {
			top: 3px !important;
		}
	}

	.dm {
		height: 42px !important;

		.text {
			font-size: 15px;
			top: 10.5px;
			left: 50px;
			width: calc(100vw - 80px);
			line-height: 20px;
			height: 20px;
		}
	}

	.muted {
		opacity: 0.7;

		> :global(*) {
			color: #4f545c;
		}

		&:focus {
			opacity: 1;
		}
	}
</style>
