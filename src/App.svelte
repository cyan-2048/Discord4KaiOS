<script>
	import Channel from "./components/Channel.svelte";
	import Channels from "./components/Channels.svelte";
	import Messages from "./components/Messages.svelte";
	import Separator from "./components/Separator.svelte";
	import Servers from "./components/Servers.svelte";
	import { onMount } from "svelte";
	import { DiscordXHR } from "./lib/DiscordXHR.js";
	import { EventEmitter } from "./lib/EventEmitter.js";
	import { wouldMessagePing, centerScroll, siftChannels, last } from "./lib/helper";
	var discordGateway = new (class extends EventEmitter {
		constructor() {
			super();
			let worker = new Worker("/worker.js");
			this.worker = worker;
			worker.onmessage = (e) => {
				let { event, data } = e.data;
				this.emit(event, data);
			};
		}
		init(token) {
			this.worker.postMessage({ event: "init", token });
		}
	})();
	import SpatialNavigation from "./lib/spatial_navigation";
	const sn = SpatialNavigation;
	sn.init();
	sn.add({
		id: "default",
		selector: ".selected [data-focusable]",
	});
	import Message from "./components/Message.svelte";
	import Server from "./components/Server.svelte";
	import ServerFolder from "./components/ServerFolder.svelte";
	import MessageSeparator from "./components/MessageSeparator.svelte";
	let discord = new DiscordXHR({ cache: true });
	let selected = 1;

	window.onkeydown = (e) => {
		let { key, target } = e;
		if (selected > 0) {
			if (/Arrow(Up|Down)/.test(key)) e.preventDefault(); //don't scroll
			if (key == "Enter") target.click();
		}
		if (selected == 0 && key == "Backspace") {
			e.preventDefault();
			setTimeout(() => (selected = 1), 50);
		}
		if (selected == 1 && /-|Left|Back/.test(key)) {
			e.preventDefault();
			selected = 2;
		}
		if (selected == 2 && /=|Right/.test(key)) {
			document.activeElement.blur();
			sn.focus();
			selected = 1;
		}
	};
	window.addEventListener("sn:focused", () => setTimeout(() => centerScroll(document.activeElement), 50));
	$: selected !== null &&
		(() => {
			console.log("selected changed", selected);
			document.activeElement.blur();
			setTimeout(() => sn.focus(), 50);
		})();

	let guild = false;
	let serverProfile = null;
	let roles = null;
	let channel = null;

	let servers = [];
	let channels = [];
	let messages = [];
	let ready = false;

	let loadDMS = async () => {
		document.activeElement.blur();
		channels = [];
		serverProfile = null;
		roles = null;
		let dms = await discord.getChannelsDM();
		let sift = dms.map((ch) => {
			let name =
				ch.name ||
				ch.recipients
					.map(function (x) {
						return x.username;
					})
					.join(", ");

			let { id, icon, recipients, last_message_id } = ch;
			let { id: user_id, avatar } = recipients[0];

			let subtext = icon ? ch.recipients.length + " Members" : null;

			return {
				type: "channel",
				name,
				id,
				last_message_id,
				subtext,
				avatar: !icon && !avatar ? "/css/default.png" : `https://cdn.discordapp.com/${icon ? "channel-icons" : "avatars"}/${icon ? id : user_id}/${icon || avatar}.jpg`,
			};
		});
		sift.sort((a, b) => Number(b.last_message_id) - Number(a.last_message_id));
		channels = sift;
		if (selected !== 1) selected = 1;
		setTimeout(() => sn.focus(), 50);
		return sift;
	};

	let loadChannels = async () => {
		document.activeElement.blur();
		channels = [];
		roles = await discord.getRoles(guild.id);
		serverProfile = await discord.getServerProfile(guild.id, discord.user.id);
		let raw = await discord.getChannels(guild.id);
		channels = siftChannels(raw, roles, serverProfile).map((a) => {
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
		if (selected !== 1) selected = 1;
		setTimeout(() => sn.focus(), 50);
		return channels;
	};

	$: guild === null && loadDMS();
	$: guild && loadChannels();

	$: channel &&
		(async () => {
			messages = [];
			let msgs = await discord.getMessages(channel.id, 30);
			messages = [...msgs].reverse();
			selected = 0;
			setTimeout(() => {
				let zel = document.querySelector(".zero.selected");
				zel?.lastElementChild?.scrollIntoView(true);
				zel?.focus();
			}, 900);
		})();

	let loadMessages = async (channel_id, roles, serverProfile) => {};

	let init = async () => {
		ready = true;
		guild = null;
		let wait = await discord.getServers();
		servers = wait.map((e) => {
			let { id, name, icon, roles } = e;
			return { id, name, icon, roles };
		});
	};

	onMount(() => {
		let token = localStorage.token;
		if (token) {
			discord.login(token);
			discordGateway.init(token);
		} else {
			window.login = (e) => {
				localStorage.token = e;
				discordGateway.init(e);
			};
		}
	});

	window.discord = discord;
	window.discordGateway = discordGateway;
	let isChannel = (o) => !!(o.name && o.type === "channel");
	window.setSelect = (o) => (selected = o);

	let selectChannel = async (e) => {
		let { id } = e.detail;
		let sift = channels.find((d) => d.id == id);
		if (sift && channel?.id != sift.id) {
			channel = sift;
		} else {
			selected = 0;
		}
	};
	let selectServer = async (e) => {
		let { id } = e.detail;
		if (id === null) return (guild = id);
		let sift = servers.find((d) => d.id == id);
		if (sift && guild?.id != sift.id) {
			guild = sift;
		} else {
			selected = 1;
		}
	};

	discordGateway.on("t:ready", (a) => {
		discord.user = a.user;
		let { user_settings, guilds, read_state, user_guild_settings } = a;
		Object.assign(discord.cache, { user_settings, guilds, read_state, user_guild_settings });
	});
	discordGateway.once("t:ready", init);
	discordGateway.on("t:message_delete", (d) => {
		if (d.channel_id == channel.id && messages.find((e) => e.id == d.id)) {
			messages = messages.filter((m) => m.id != d.id);
		}
	});

	discordGateway.on("t:user_settings_update", (d) => {
		if (discord.cache) Object.assign(discord.cache.user_settings, d);
	});
	discordGateway.on("t:presence_update", (d) => {
		if (!discord.cache) return;
		let e = discord.cache.guilds.find((a) => a.id == d.guild_id);
		if (e) {
			let ix = e.presences.findIndex((a) => a.user.id == d.user.id);
			if (ix) e.presences[ix] = d;
			else e.presences.push(d);
		}
	});

	let serverAck = new EventEmitter();
	serverAck.on("update", (a) => console.error("serverAck", a));
	discordGateway.on("t:message_ack", (a) => {
		if (!discord.cache) return;
		let el = discord.cache.read_state.find((e) => e.id == a.channel_id);
		if (el) {
			el.last_message_id = a.message_id;
			el.mention_count = 0;
		}
		serverAck.emit("update", a);
	});
	discordGateway.on("t:message_create", async (d) => {
		if (channel?.id == d.channel_id) {
			messages = [...messages, d];
		}
		if (!discord.cache) return;
		let e;
		discord.cache.guilds.find((a) => (e = a.channels.find((a) => a.id == d.channel_id)));
		if (e) {
			e.last_message_id = d.id;
		}
		let el = discord.cache.read_state.find((e) => e.id == d.channel_id);
		if (d.guild_id) {
			let r = d.guild_id == guild?.id ? serverProfile : await discord.getServerProfile(d.guild_id, discord.user.id);
			let ping = wouldMessagePing(d, r.roles);
			if (el && ping) el.mention_count++;
		}
		serverAck.emit("update", d);
	});
	discordGateway.on("t:user_guild_settings_update", (d) => {
		let m = discord.cache.user_guild_settings;
		let ix = m.findIndex((a) => a.guild_id == d.guild_id);
		if (ix > -1) m[ix] = d;
		else m.push(d);
		serverAck.emit("update", d);
	});

	let spreadAuthor = (e) => {
		let { author, id, username, avatar } = e;
		return { author, id, name: username, avatar };
	};
</script>

{#if ready}
	<Servers {selected}>
		<Server on:select={selectServer} selected={!guild} {serverAck} {discordGateway} {discord} dm={true} />
		{#each servers as server}
			{#if server.folder}
				<ServerFolder {...server} {discordGateway} {discord} />
			{:else}
				<Server on:select={selectServer} selected={guild?.id === server.id} {serverAck} {server} {discordGateway} {discord} />
			{/if}
		{/each}
	</Servers>
	<Channels {selected}>
		{#if guild === null}
			<Separator>DIRECT MESSAGES</Separator>
		{/if}
		{#each channels as channel}
			{#if isChannel(channel)}
				<Channel {discord} {serverAck} guildID={guild ? guild.id : null} on:select={selectChannel} {...channel}>{channel.name || ""}</Channel>
			{:else if channel.name !== 0}
				<Separator>{channel.name}</Separator>
			{/if}
		{/each}
	</Channels>
	<Messages {selected}>
		{#each messages as message, i (message.id)}
			{#if messages[i - 1]?.author.id != message.author?.id}
				<MessageSeparator {...spreadAuthor(message.author)} {discord} />
			{/if}
			<Message {roles} {discord} profile={serverProfile} {discordGateway} {message} />
		{/each}
	</Messages>
{/if}

<style>
</style>
