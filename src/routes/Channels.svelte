<script>
	import { onDestroy, onMount, tick } from "svelte";
	import { channelUpdates, discord, discordGateway, isServerOwner } from "../lib/database";

	import Separator from "../components/Separator.svelte";
	import Channel from "../components/Channel.svelte";
	import { centerScroll, changeStatusbarColor, delay, siftChannels } from "../lib/helper";
	import Server from "../components/Server.svelte";
	import ServerFolder from "../components/ServerFolder.svelte";
	import { longpress, serverProfiles, settings, sn } from "../lib/shared";
	import { eventHandler } from "../lib/EventEmitter";

	export let _guildID;

	let previous_route = "@me";

	$: guildID = _guildID && previous_route !== _guildID ? (previous_route = _guildID) : "@me";

	let channels = [];
	let servers = [];
	let selected = 1;
	let guildName = null;

	changeStatusbarColor("#1a1a1c");

	async function loadChannels(guildID, update = false) {
		if (guildID === "@me") {
			if (!update) channels = [];
			const dms = await discord.getChannelsDM();
			const sift = dms.map((ch) => {
				const name = ch.name || ch.recipients.map((x) => x.username).join(", ");

				const { id, icon, recipients, last_message_id } = ch || {};
				const { id: user_id, avatar } = recipients[0] || {};

				return {
					type: "channel",
					name,
					id,
					dm: true,
					recipients,
					last_message_id,
					avatar: !icon && !avatar ? "/css/default.png" : `https://cdn.discordapp.com/${icon ? "channel-icons" : "avatars"}/${icon ? id : user_id}/${icon || avatar}.jpg`,
				};
			});
			sift.sort((a, b) => Number(b.last_message_id) - Number(a.last_message_id));
			channels = sift;
			console.log("dms:", channels);
		} else {
			if (!update) {
				discordGateway.send({
					op: 14,
					d: {
						activities: true,
						guild_id: guildID,
						threads: false,
						typing: true,
					},
				});
				discordGateway.send({
					op: 8,
					d: {
						guild_id: [guildID],
						query: "",
						limit: 100,
						presences: false,
						user_ids: undefined,
					},
				});
				channels = [];
			}
			const guild = await discord.getServer(guildID);
			guildName = guild.name;
			const roles = await discord.getRoles(guildID);
			const serverProfile = $serverProfiles.get(guildID + "/" + discord.user.id) || (await discord.getServerProfile(guildID, discord.user.id));
			const raw = await discord.getChannels(guildID);
			channels = siftChannels(raw, roles, serverProfile, await isServerOwner(guildID)).map((a) => {
				let type = isNaN(a.type) ? a.type : "channel";
				let ch_type =
					a.type === 5
						? "announce"
						: (() => {
								let ft = a.permission_overwrites?.find((l) => l.id == roles.find((p) => p.position == 0).id);
								if (!ft) return false;
								return (ft.deny & 1024) == 1024;
						  })()
						? "limited"
						: "text";
				return { ...a, type, ch_type };
			});
			console.log("channels:", channels);
		}
	}

	async function loadServers() {
		servers = [];
		const wait = await discord.getServers();
		const { guild_positions: serverPositions, guild_folders: serverFolders } = discord.cache.user_settings;

		let temp = [];
		wait
			.map(({ id, name, icon, roles }) => ({ id, name, icon, roles }))
			.sort((a, b) => {
				let indexer = ({ id }) => serverPositions?.indexOf(id);
				return indexer(a) - indexer(b);
			})
			.forEach((a) => {
				let folder = serverFolders.find((e) => e.id && e.guild_ids?.includes(a.id));
				if (folder) {
					const found = temp.find((a) => a.type === "folder" && a.id === folder.id);
					found ? found.servers.push(a) : temp.push({ type: "folder", id: folder.id, servers: [a], color: folder.color, name: folder.name });
				} else temp.push(a);
			});

		servers = temp;
	}

	loadServers();

	// let lastFocused = null;

	async function focusChannels() {
		await tick();
		await delay(25);
		await delay(document.querySelector("[data-channels] [data-focusable]") ? 25 : 600);

		//console.error(lastFocused);
		//document.getElementById(lastFocused)?.focus();
		sn.focus("channels");
	}

	$: if (guildID) {
		loadChannels(guildID);
		selected = 1;
		focusChannels();
	}

	onMount(() => {
		const ids = ["servers", "channels"];
		ids.forEach((id) =>
			sn.add({
				id,
				selector: `[data-${id}] [data-focusable]`,
				restrict: "self-only",
				rememberSource: true,
			})
		);

		if (selected == 1) setTimeout(() => sn.focus(ids[1]), 1000);

		return () => {
			ids.forEach(sn.remove);
		};
	});

	let busy = false;

	onDestroy(
		eventHandler(discordGateway, "t:guild_member_update", function (event) {
			var { detail: d } = event || {};
			if (guildID === d.guild_id) {
				loadChannels(guildID, true);
			}
		})
	);

	onDestroy(
		eventHandler(channelUpdates, "update", function (event) {
			var { detail: d } = event || {};
			if (guildID === d.guild_id) {
				console.log(d);
				loadChannels(guildID, true);
			}
		})
	);
</script>

<main
	on:sn:willunfocus={({ target, detail }) => {
		const { nextElement: next } = detail || {};
		if (next) {
			centerScroll(next, !$settings.smooth_scroll || $longpress);
		}
	}}
	on:keydown={async function ({ target, key, repeat }) {
		if (busy) return;
		busy = true;

		if (key === "Enter") {
			target.click();
			// if (target.id.startsWith("channel")) lastFocused = target.id;
			await tick();
		}

		async function focus(id) {
			await tick();
			sn.focus(id);
			if (id === "servers") {
				const actEl = document.activeElement;
				const serversEl = actEl.closest("[data-servers]");
				if (guildID === "@me" || serversEl.firstElementChild !== actEl) return;
				const found = serversEl.querySelector("main.selected");
				if (found) {
					const parent = found.parentElement;
					!parent.matches("[data-focusable]") ? found.focus() : parent.focus();
				}
			}
		}

		if (!repeat) {
			if ((key === "Backspace" || key === "ArrowLeft" || key === "SoftLeft") && selected === 1) {
				selected = 0;
				focus("servers");
			} else if (selected === 0) {
				if (key === "Backspace") {
					confirm("Do you wanna exit the app?") && window.close();
				}
				if (key === "ArrowRight" || key === "SoftRight") {
					selected = 1;
					focus("channels");
				}
			}
		}

		busy = false;
	}}
>
	<div class:selected={selected === 0} class:hidden={selected === 1}>
		<div data-servers>
			<Server selected={guildID === "@me"} dm={true} />
			{#each servers as server (server.id)}
				{#if server.type === "folder"}
					<ServerFolder {guildID} {...server} />
				{:else}
					<Server selected={guildID === server.id} {server} />
				{/if}
			{/each}
		</div>
	</div>

	<div data-channels class:isGuild={guildID !== "@me"} class:selected={selected === 1}>
		{#if guildID !== "@me"}
			<div class="header" class:selected={selected !== 1}>
				<div>
					{guildName}
				</div>
			</div>
		{/if}
		{#if guildID === "@me"}
			<Separator>DIRECT MESSAGES</Separator>
		{/if}
		{#each channels as channel (channel.id || channel.name)}
			{#if channel.type !== "separator"}
				<Channel {guildID} {...channel}>{channel.name || ""}</Channel>
			{:else if channel.name !== 0}
				<Separator>{channel.name}</Separator>
			{/if}
		{/each}
	</div>
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	main {
		width: 100vw;
		height: 100vh;
		display: flex;
		overflow: hidden;
		border: 1px solid rgb(92, 92, 92);

		* {
			flex-grow: 0;
			flex-shrink: 0;
			height: 100%;
			overflow: hidden;
			overflow-y: auto;
			position: relative;
		}

		> :last-child {
			// &.isGuild {
			// 	padding-top: 30px;
			// }

			width: 100vw;
			@include linearGradient(40%, hsl(240, 3.7%, 10.6%), !important);
			background-color: hsl(225, 8%, 19.6%) !important;
		}

		> :first-child {
			@extend %layer1;
			background-attachment: fixed;
			box-shadow: inset -1px 0 0 rgb(92, 92, 92);
		}

		> :first-child,
		> :first-child > div {
			width: 72px;
			transition: width 0.25s ease;
		}

		> :first-child > div {
			padding: 8px 12px;
			position: absolute;
			right: 0;
		}

		.hidden {
			width: 0 !important;
		}
	}

	.header {
		padding: 0 10px;
		height: 30px;
		font-size: 15px;
		font-weight: 600;

		div {
			width: 100%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		display: flex;
		align-items: center;
		margin-bottom: 3px;

		position: sticky;
		width: 100vw;
		top: 0;
		// left: 0;
		z-index: 100;

		color: #ffffff;

		@include linearGradient(14%, rgba(58, 58, 58));
		background-color: rgba(0, 0, 0);
		border-bottom: 1px solid rgba(92, 92, 92);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4), 0 0 5px 5px rgba(0, 0, 0, 0.4) !important;

		line-height: 1.6;

		&.selected {
			// left: 72px;
			width: calc(100vw - 72px);
		}

		transition: left 0.25s ease, width 0.25s ease;
	}
</style>
