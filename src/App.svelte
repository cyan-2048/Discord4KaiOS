<script>
	import Channel from "./components/Channel.svelte";
	import Channels from "./components/Channels.svelte";
	import Messages from "./components/Messages.svelte";
	import Separator from "./components/Separator.svelte";
	import Servers from "./components/Servers.svelte";
	import { onMount } from "svelte";
	import { DiscordXHR } from "./lib/DiscordXHR.js";
	import { EventEmitter } from "./lib/EventEmitter.js";
	import { wouldMessagePing, getScrollBottom, inViewport, centerScroll, hashCode, siftChannels, last, parseRoleAccess, findUserByTag } from "./lib/helper";
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
		send(object) {
			this.worker.postMessage({ event: "send", object });
		}
	})();
	import SpatialNavigation from "./lib/spatial_navigation.js";
	const sn = SpatialNavigation;
	sn.init();
	["messages", "channels", "servers"].forEach((id) =>
		sn.add({
			id,
			selector: `[data-${id}].selected [data-focusable]`,
			rememberSource: true,
		})
	);
	import Message from "./components/Message.svelte";
	import Server from "./components/Server.svelte";
	import ServerFolder from "./components/ServerFolder.svelte";
	import MessageSeparator from "./components/MessageSeparator.svelte";
	import Login from "./Login.svelte";
	let discord = new DiscordXHR({ cache: true });
	let selected = 1;
	let appState = "app";

	window.addEventListener("keydown", (e) => {
		if (appState !== "app" || e.shiftKey) return;
		let { key, target } = e;
		if (selected > 0) {
			if (/Arrow(Up|Down)/.test(key)) e.preventDefault(); //don't scroll
			if (/Right|Enter/.test(key)) target.click();
		}
		if (selected == 0 && (key == "Backspace" || key == "ArrowLeft") && (target.tagName !== "TEXTAREA" || target.value === "")) {
			e.preventDefault();
			setTimeout(() => (selected = 1), 50);
		}

		if (selected === 1 && /-|Left|Back/.test(key)) {
			e.preventDefault();
			selected = 2;
		}
		if (selected === 2 && /=|Right/.test(key)) {
			document.activeElement.blur();
			sn.focus();
			selected = 1;
		}
	});
	window.addEventListener("sn:navigatefailed", (e) => {
		if (appState !== "app") return;
		let { direction } = e.detail;
		if (selected !== 0) return;
		if (direction === "left") setTimeout(() => (selected = 1), 50);
		if (!/up|down/.test(direction)) return;
		let actEl = document.activeElement;
		if (!actEl.id.startsWith("msg")) return;
		if (actEl.offsetHeight > window.innerHeight) {
			actEl.parentNode.scrollBy({
				top: direction === "up" ? -66 : 66,
				behavior: "smooth",
			});
		}
		if (direction === "down" && getScrollBottom(actEl.parentNode) === 0) {
			document.querySelector(".grow-wrap textarea").focus();
		}
	});
	window.addEventListener("sn:willunfocus", (e) => {
		if (appState !== "app") return;
		let { nextElement: next, direction } = e.detail;
		if (!/up|down/.test(direction) || selected !== 0) return;
		let actEl = document.activeElement;
		if (!actEl.id.startsWith("msg")) return;
		if (actEl.offsetHeight > window.innerHeight - 71) {
			e.preventDefault();
			actEl.parentNode.scrollBy({
				top: direction === "up" ? -66 : 66,
				behavior: "smooth",
			});
			if (!next) return;
			if (next.offsetHeight > window.innerHeight - 71) {
				if (inViewport(next, true)) next.focus();
			} else if (inViewport(next)) {
				next.focus();
				setTimeout(() => centerScroll(next), 50);
			}
		} else if (next && next.offsetHeight < window.innerHeight - 71) setTimeout(() => centerScroll(next), 50);
	});

	$: selected !== null &&
		(() => {
			console.log("selected changed", selected);
			document.activeElement.blur();
			setTimeout(() => {
				let query = document.querySelector(".two.selected .selected");
				if (selected === 2 && query) {
					query.parentElement.matches("[data-folder][data-focusable]") ? query.parentElement.focus() : query.focus();
					return;
				}
				sn.focus();
				if (selected === 0) {
					setTimeout(() => document.querySelector(".grow-wrap textarea").focus(), 20); // if element is not focusable, it will not blur first focused element...
				}
			}, 50);
		})();

	let guild = false;
	let serverProfile = null;
	let roles = null;
	let channel = null;

	let servers = [];
	let channels = [];
	let messages = [];
	let ready = false;
	let channelPermissions = {};

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

	let loadMessages = async () => {
		if (!channel.dm) {
			channelPermissions = parseRoleAccess(channel.permission_overwrites, serverProfile.roles.concat([roles.find((p) => p.position == 0).id, serverProfile.user.id]));
		} else channelPermissions = {};
		messages = [];
		let msgs = await discord.getMessages(channel.id, 30);
		messages = [...msgs].reverse();
		selected = 0;
		setTimeout(() => {
			let zel = document.querySelector(".zero.selected");
			if (zel) zel.scrollTop = zel.scrollHeight;
			last(zel.children)?.focus();
		}, 100);
	};

	$: channel && loadMessages();

	let init = async () => {
		ready = true;
		guild = null;
		let wait = await discord.getServers();
		servers = wait.map((e) => {
			let { id, name, icon, roles } = e;
			return { id, name, icon, roles };
		});
		let attempts = 0;
		discordGateway.on("close", function () {
			if (attempts == 5) {
				if (confirm("The Discord gateway closed 5 times already! Do you want to retry connecting? You might get rate limited...")) {
					attempts = -1;
				} else return window.close();
			}
			attempts++;
			discordGateway.init(localStorage.token);
			if (channel) loadMessages();
		});
	};

	let login = (e) => {
		appState = "app";
		localStorage.token = e;
		discord.login(e);
		discordGateway.init(e);
	};

	onMount(() => {
		let token = localStorage.token;
		if (token) {
			discord.login(token);
			discordGateway.init(token);
		} else {
			appState = "login";
			window.login = login;
		}
	});

	window.discord = discord;
	window.discordGateway = discordGateway;
	window.changeAppState = (e) => (appState = e);
	window.changeReadyState = (e) => (ready = e);
	let isChannel = (o) => !!(o.name && o.type === "channel");

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
		if (!channel) return;
		if (d.channel_id == channel.id && messages.find((e) => e.id == d.id)) {
			messages = messages.filter((m) => m.id != d.id);
		}
	});
	discordGateway.on("t:user_settings_update", (d) => {
		if (discord.cache) Object.assign(discord.cache.user_settings, d);
	});
	let serverAck = new EventEmitter();
	discordGateway.on("t:presence_update", (d) => {
		if (!discord.cache) return;
		let e = discord.cache.guilds.find((a) => a.id == d.guild_id);
		if (e) {
			let ix = e.presences.findIndex((a) => a.user.id == d.user.id);
			if (ix > -1) e.presences[ix] = d;
			else e.presences.push(d);
		}
		serverAck.emit("status", d);
	});
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
			setTimeout(() => {
				let messages = document.querySelector("[data-messages]");
				if (getScrollBottom(messages) < 100) {
					centerScroll(last(messages.children));
				}
			}, 50);
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
			let ping = wouldMessagePing(d, r.roles, discord);
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
		let { bot, discriminator, id, username, avatar } = e;
		return { bot, discriminator, id, name: username, avatar };
	};
	const cachedMentions = (() => {
		let mentionCache = {};
		function delay() {
			console.log("delaying");
			return new Promise((r) => setTimeout(r, 1000));
		}
		let pending = Promise.resolve();
		async function func() {
			let args = [...arguments];
			let hash = hashCode(args.join(""));
			let type = args.shift();
			let res = await discord[type](...args);
			while (res.message && res.code !== 10007 && res.code !== 10013) {
				await delay();
				res = await discord[type](...args);
			}
			mentionCache[hash] = res;
			return res;
		}
		const run = async function () {
			try {
				await pending;
			} finally {
				return func(...arguments);
			}
		};
		// update pending promise so that next task could await for it
		const final = function () {
			let args = [...arguments];
			let obj = mentionCache[hashCode(args.join(""))];
			if (obj) return Promise.resolve(obj);
			return (pending = run(...args));
		};
		final.findUserByTag = findUserByTag(mentionCache);
		final.getGuildMembers = function (query = "", limit = 5) {
			return new Promise((res) => {
				discordGateway.send({
					op: 8,
					d: {
						guild_id: guild.id,
						query,
						limit,
					},
				});
				discordGateway.once("t:guild_members_chunk", (d) => {
					res(
						d.members.map((a) => {
							a.guild_id = guild.id;
							return a;
						})
					);
				});
			});
		};
		window.cachedMentions = final;
		return final;
	})();
	let sendMessage = (e, opts = {}) => discord.sendMessage(channel.id, e, opts);

	onMount(() => {
		function initEmoji(link, toSave) {
			let xhr = new XMLHttpRequest({ mozSystem: true });
			xhr.open("get", link, true);
			xhr.responseType = "blob";
			xhr.onload = () => {
				let r = xhr.response;
				let el = document.createElement("style");
				let url = URL.createObjectURL(r);
				el.innerHTML = `@font-face { font-family: twemoji; src: url("${url}");}`;
				document.documentElement.appendChild(el);
				if (toSave === true) {
					let reader = new FileReader();
					reader.readAsDataURL(r);
					reader.onloadend = () => localStorage.setItem("emoji-font", reader.result);
				}
			};
			xhr.send();
		}
		let emoji = localStorage.getItem("emoji-font");
		initEmoji(emoji || "https://github.com/mozilla/twemoji-colr/releases/latest/download/TwemojiMozilla.ttf", !!!emoji);
	});
</script>

{#if ready}
	<Servers {appState} {selected}>
		<Server on:select={selectServer} selected={!guild} {serverAck} {discord} dm={true} />
		{#each servers as server}
			{#if server.folder}
				<ServerFolder {...server} {discord} />
			{:else}
				<Server on:select={selectServer} selected={guild?.id === server.id} {serverAck} {server} {discord} />
			{/if}
		{/each}
	</Servers>
	<Channels {appState} {selected}>
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
	<Messages {sendMessage} {sn} {roles} {channel} {channelPermissions} {appState} {selected}>
		{#each messages as message, i (message.id)}
			{#if messages[i - 1]?.author.id != message.author?.id}
				<MessageSeparator {cachedMentions} userID={discord.user.id} {roles} {...spreadAuthor(message.author)} guildID={guild ? guild.id : null} {channel} profile={serverProfile} />
			{/if}
			<Message guildID={guild ? guild.id : null} {cachedMentions} {roles} {channel} {discord} profile={serverProfile} {discordGateway} msg={message} />
		{/each}
	</Messages>
{:else}
	<div id="loading">
		<img src="/css/loading.png" alt />
		<div id="dyk">DID YOU KNOW</div>
		<div id="fact">svelte is awesome</div>
	</div>
{/if}
{#if appState === "login"}
	<Login {sn} on:login={(e) => login(e.detail.token)} />
{/if}

<style>
	#loading {
		width: 100vw;
		height: 100vh;
		position: absolute;
		top: 0;
		left: 0;
		background-color: #2f3136;
		text-align: center;
	}
	#loading img {
		width: 200px;
		height: 200px;
		margin: 12px 0;
		display: inline-block;
	}
	#dyk {
		font-size: 12px;
		margin-top: -35px;
		font-weight: 600;
		margin-bottom: 8px;
	}
	#fact {
		font-size: 16px;
		height: 75px;
	}
</style>
