<script>
	import Channel from "./components/Channel.svelte";
	import Channels from "./components/Channels.svelte";
	import Messages from "./components/Messages.svelte";
	import Separator from "./components/Separator.svelte";
	import Servers from "./components/Servers.svelte";
	import { onMount } from "svelte";
	import { DiscordXHR } from "./lib/DiscordXHR.js";
	import { EventEmitter } from "./lib/EventEmitter.js";
	import {
		wouldMessagePing,
		getScrollBottom,
		inViewport,
		centerScroll,
		hashCode,
		siftChannels,
		last,
		parseRoleAccess,
		findUserByTag,
		asyncQueueGenerator,
		asyncRateLimitGenerator,
		syncCachedGenerator,
		asyncCachedGenerator,
	} from "./lib/helper";
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
			restrict: "self-only",
		})
	);
	import Message from "./components/Message.svelte";
	import Server from "./components/Server.svelte";
	import ServerFolder from "./components/ServerFolder.svelte";
	import MessageSeparator from "./components/MessageSeparator.svelte";
	import Login from "./Login.svelte";
	import DateSeparator from "./components/DateSeparator.svelte";
	import TypingState from "./lib/TypingState";
	import ImageViewer from "./ImageViewer.svelte";
	let discord = new DiscordXHR({ cache: true });
	let selected = 1;
	let appState = "app";
	let viewerSrc = null;

	let ready = false;

	window.addEventListener("keydown", (e) => {
		let { key, target } = e;
		if (key === "Backspace" && !("value" in target)) e.preventDefault();
		if (appState !== "app" || e.shiftKey) return;
		if (selected > 0) {
			if (/Arrow(Up|Down)/.test(key)) e.preventDefault(); //don't scroll
			if (/Enter/.test(key)) target.click();
		}
		if (selected == 0 && (key == "Backspace" || key == "ArrowLeft" || key == "SoftLeft") && (target.tagName !== "TEXTAREA" || target.value === "")) {
			setTimeout(() => (selected = 1), 50);
		}

		if (selected === 1 && /-|Left|Back/.test(key)) {
			setTimeout(() => (selected = 2), 50);
		}
		if (selected === 2 && /=|Right/.test(key)) {
			document.activeElement.blur();
			sn.focus();
			selected = 1;
		}
		if (key === "Backspace" && (selected === 2 || !ready) && confirm("Are you sure you want to exit the app?")) window.close();
	});
	window.addEventListener("sn:navigatefailed", (e) => {
		if (appState !== "app") return;
		let { direction } = e.detail;
		if (selected !== 0) return;
		if (direction === "left") setTimeout(() => (selected = 1), 50);
		if (!/up|down/.test(direction)) return;
		let actEl = document.activeElement;
		if (!actEl.id.startsWith("msg")) return;
		const messages = actEl.closest("[data-messages]");
		if (actEl.offsetHeight > messages.offsetHeight) {
			messages.scrollBy({
				top: direction === "up" ? -66 : 66,
				behavior: "smooth",
			});
		}
		if (direction === "down" && getScrollBottom(messages) === 0) {
			document.querySelector(".grow-wrap textarea").focus();
		}
	});
	window.addEventListener("sn:willunfocus", (e) => {
		if (appState !== "app") return;
		let { nextElement: next, direction } = e.detail;
		if (!/up|down/.test(direction) || selected !== 0) return;
		let actEl = document.activeElement;
		if (!actEl.id.startsWith("msg")) return;
		const messages = actEl.closest("[data-messages]");
		if (actEl.offsetHeight > messages.offsetHeight) {
			// console.warn("current message is bigger than screen, we scroll...");
			e.preventDefault();
			messages.scrollBy({
				top: direction === "up" ? -66 : 66,
				behavior: "smooth",
			});
			// if (!next) // console.warn("next element to focus not found!");
			if (!next) return;
			if (next.offsetHeight > messages.offsetHeight) {
				// console.warn("next element is bigger than viewport");
				if (inViewport(next, true)) next.focus();
			} else if (inViewport(next)) {
				// console.warn("next element is not bigger than viewport and is in viewport right now");
				next.focus();
				setTimeout(() => centerScroll(next), 50);
			}
		} else if (next && next.offsetHeight < messages.offsetHeight) setTimeout(() => centerScroll(next), 50);
	});

	$: selected !== null &&
		(() => {
			document.activeElement.blur();
			setTimeout(() => {
				let query = document.querySelector(".two.selected .selected");
				if (selected === 2 && query) {
					query.parentElement.matches("[data-folder][data-focusable]") ? query.parentElement.focus() : query.focus();
					return;
				}
				sn.focus();
				if (selected === 0) {
					setTimeout(() => document.querySelector(".grow-wrap textarea").focus(), 50); // if element is not focusable, it will not blur first focused element...
				}
			}, 50);
		})();

	let guild = false;
	let serverProfile = null;
	let roles = null;
	let channel = null;

	const ack = (e) => discord.xhrRequestJSON("post", `channels/${channel.id}/messages/${e}/ack`, {}, { token: "null" });

	let servers = [];
	let channels = [];
	let messages = [];

	let channelPermissions = {};

	let loadDMS = async () => {
		document.activeElement.blur();
		channels = [];
		serverProfile = null;
		roles = null;
		let dms = await discord.getChannelsDM();
		let sift = dms.map((ch) => {
			let name = ch.name || ch.recipients.map((x) => x.username).join(", ");

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
		console.log("dms:", channels);
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
		console.log("channels:", channels);
		if (selected !== 1) selected = 1;
		setTimeout(() => sn.focus(), 50);
		return channels;
	};

	$: guild === null && loadDMS();
	$: guild && loadChannels();

	let loadMessages = async () => {
		if (!channel.dm) {
			channelPermissions = parseRoleAccess(channel.permission_overwrites, serverProfile.roles.concat([roles.find((p) => p.position == 0).id, serverProfile.user.id]), roles);
		} else channelPermissions = {};
		messages = [];
		let msgs = await discord.getMessages(channel.id, 30);
		messages = [...msgs].reverse();
		console.log("messages:", messages);
		selected = 0;
		setTimeout(() => {
			let zel = document.querySelector(".zero.selected");
			if (zel) zel.scrollTop = zel.scrollHeight;
			let _last = last(zel.children);
			if (_last) {
				_last.focus();
				ack(_last.id.slice(3));
			}
		}, 100);
	};

	$: channel && loadMessages();

	async function loadServers() {
		servers = [];
		const wait = await discord.getServers();
		const { guild_positions: serverPositions, guild_folders: serverFolders } = discord.cache.user_settings;

		let temp = [];
		wait
			.map(({ id, name, icon, roles }) => ({ id, name, icon, roles }))
			.sort((a, b) => {
				let indexer = ({ id }) => serverPositions.indexOf(id);
				return indexer(a) - indexer(b);
			})
			.forEach((a) => {
				let folder = serverFolders.find((e) => e.id && e.guild_ids?.includes(a.id));
				if (folder) {
					const found = temp.find((a) => a.type === "folder" && a.id === folder.id);
					found ? found.servers.push(a) : temp.push({ type: "folder", id: folder.id, servers: [a], color: folder.color });
				} else temp.push(a);
			});

		servers = temp;
	}

	let init = async () => {
		ready = true;
		guild = null;
		await loadServers();
		let attempts = 0;
		discordGateway.on("close", async function () {
			let internet = false;
			try {
				if (navigator.onLine) {
					await fetch("https://discord.com/api/v9/");
					internet = true;
				} else internet = false;
			} catch (e) {
				internet = false;
			}
			if (!internet && !confirm("There seems to be no internet connection, do you want to retry connecting?")) return window.close();
			else attempts = -1;
			if (attempts == 5) {
				if (internet && confirm("The Discord gateway closed 5 times already! Do you want to retry connecting? You might get rate limited...")) {
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
		let sift = null;
		let found = servers.find((d) => {
			if (d.type === "folder") {
				return (sift = d.servers.find((l) => l.id === id));
			} else return d.id === id;
		});
		if (found.type !== "folder") sift = found;
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
	const serverAck = new EventEmitter();
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
			const _messages = document.querySelector("[data-messages]");
			const shouldScroll = getScrollBottom(_messages) < 100;
			setTimeout(() => {
				if (shouldScroll) {
					centerScroll(last(_messages.children));
					ack(d.id);
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
		function delay(d = 1) {
			console.warn("delaying");
			return new Promise((r) => setTimeout(r, d * 1000));
		}

		const final = asyncRateLimitGenerator(async function () {
			let args = [...arguments];
			let type = args.shift();
			let res = await discord[type](...args);
			while (res.httpStatus === 429) {
				await delay();
				res = await discord[type](...args);
			}
			return res;
		}, 4);

		final.getGuildMembers = asyncQueueGenerator(function (query = "", limit = 5) {
			if (query === "") return Promise.resolve([]);
			return new Promise((res) => {
				if (!channel.dm) {
					discordGateway.send({
						op: 8,
						d: { guild_id: guild.id, query, limit },
					});
					discordGateway.once("t:guild_members_chunk", (d) => res(d.members.map((a) => ({ ...a, guild_id: guild.id }))));
				} else
					res(
						channel.recipients
							.filter((a) => a.username.includes(query))
							.slice(0, limit)
							.map((a) => ({ user: { ...a } }))
					);
			});
		});
		final.findUserByTag = syncCachedGenerator(findUserByTag(final.cache, final.getGuildMembers.cache));
		final.findUserById = asyncCachedGenerator(async function (id) {
			let cached = [final.cache, final.getGuildMembers.cache].map((a) => Object.values(a)).flat(2);
			let len = cached.length;
			let done = null;
			for (let index = 0; index < len; index++) {
				const obj = cached[index];
				const user = obj.user || (obj.username ? obj : null);
				if (!user || user.id !== id) continue;
				done = user;
				break;
			}
			return done || (await final("getProfile", id)).user;
		});
		window.cachedMentions = final;
		return final;
	})();
	function sendMessage(e, opts = {}) {
		return discord.sendMessage(channel.id, e, opts);
	}

	sendMessage.sed = function (sedString) {
		if (!sedString) return;
		let regex = "";
		let string = "";
		let toSplit = sedString.slice(2);
		if (toSplit.split("/").length === 2) {
			let [a, b] = toSplit.split("/");
			regex = new RegExp(a);
			string = b;
		} else {
			let escaped = [...toSplit.matchAll(/\\\//g)].map((a) => a.index + 1);
			let matches = [...toSplit.matchAll(/\//g)].map((a) => a.index);
			let exact = matches.filter((a) => !escaped.includes(a));
			let index = exact[0];
			regex = new RegExp(toSplit.slice(0, index));
			string = toSplit.slice(index + 1);
		}
		let findMessage = [...messages].reverse().find((a) => a.author.id === discord.user.id);
		if (!findMessage) return;
		let original = findMessage.content;
		let modified = findMessage.content.replace(regex, string);
		if (modified !== original) discord.editMessage(channel.id, findMessage.id, modified);
	};

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

	function diff_minutes(dt2, dt1) {
		var diff = (dt2.getTime() - dt1.getTime()) / 1000;
		diff /= 60;
		return Math.abs(Math.round(diff));
	}

	const evtForward = new EventEmitter();

	const typingState = new TypingState();
	discordGateway.on("t:typing_start", (d) => typingState.add(d));
</script>

{#if ready}
	<Servers {appState} {selected}>
		<Server on:select={selectServer} selected={!guild} {serverAck} {discord} dm={true} />
		{#each servers as server (server.id)}
			{#if server.type === "folder"}
				<ServerFolder {guild} on:select={selectServer} {serverAck} {discord} {...server} />
			{:else}
				<Server on:select={selectServer} selected={guild?.id === server.id} {serverAck} {server} {discord} />
			{/if}
		{/each}
	</Servers>
	<Channels {appState} {selected}>
		{#if guild === null}
			<Separator>DIRECT MESSAGES</Separator>
		{/if}
		{#each channels as channel (channel.id || channel.name)}
			{#if isChannel(channel)}
				<Channel {discord} {serverAck} guildID={guild ? guild.id : null} on:select={selectChannel} {...channel}>{channel.name || ""}</Channel>
			{:else if channel.name !== 0}
				<Separator>{channel.name}</Separator>
			{/if}
		{/each}
	</Channels>
	<Messages
		on:v-image={({ detail: { src } }) => {
			document.activeElement.blur();
			viewerSrc = src;
			appState = "viewer";
		}}
		{typingState}
		{evtForward}
		{sendMessage}
		{discord}
		{sn}
		{roles}
		{channel}
		{channelPermissions}
		{appState}
		{selected}
		guildID={guild ? guild.id : null}
	>
		{#each messages as message, i (message.id)}
			{#if i !== 0 && new Date(messages[i - 1].timestamp).toLocaleDateString("en-us") !== new Date(message.timestamp).toLocaleDateString("en-us")}
				<DateSeparator>{new Date(message.timestamp).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}</DateSeparator>
			{/if}
			{#if i === 0 || messages[i - 1]?.author.id != message.author?.id || (messages[i - 1] && diff_minutes(new Date(messages[i - 1].timestamp), new Date(message.timestamp)) > 0)}
				<MessageSeparator {cachedMentions} userID={discord.user.id} {roles} {...spreadAuthor(message.author)} guildID={guild ? guild.id : null} {channel} profile={serverProfile} />
			{/if}
			<Message
				on:update={(e) => (messages[i] = e.detail.message)}
				guildID={guild ? guild.id : null}
				{cachedMentions}
				{roles}
				{channel}
				{discord}
				profile={serverProfile}
				{discordGateway}
				msg={message}
				{evtForward}
			/>
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
{:else if appState === "viewer"}
	<ImageViewer
		on:close={() => {
			appState = "app";
			setTimeout(() => {
				document.activeElement.blur();
				sn.focus();
			}, 50);
		}}
		src={viewerSrc}
	/>
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
