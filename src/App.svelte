<script>
	// components
	import Channel from "./components/Channel.svelte";
	import Channels from "./components/Channels.svelte";
	import Messages from "./components/Messages.svelte";
	import Separator from "./components/Separator.svelte";
	import Servers from "./components/Servers.svelte";
	import Message from "./components/Message.svelte";
	import Server from "./components/Server.svelte";
	import ServerFolder from "./components/ServerFolder.svelte";
	import MessageSeparator from "./components/MessageSeparator.svelte";
	import Login from "./Login.svelte";
	import DateSeparator from "./components/DateSeparator.svelte";
	import ImageViewer from "./ImageViewer.svelte";
	import Loading from "./components/Loading.svelte";

	// js
	import { onMount } from "svelte";
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
	import { discordGateway, sn, discord, typingState, serverAck } from "./lib/shared";
	sn.init();

	["messages", "channels", "servers"].forEach((id) =>
		sn.add({
			id,
			selector: `[data-${id}].selected [data-focusable]`,
			rememberSource: true,
			restrict: "self-only",
		})
	);

	let settings = (() => {
		const defaultSettings = {
			custom_rpc: true,
		};
		let fromStorage = localStorage.settings;
		if (fromStorage) {
			fromStorage = JSON.parse(fromStorage);
			for (const key in defaultSettings) {
				if (!(key in fromStorage)) {
					fromStorage[key] = defaultSettings[key];
				}
			}
			for (const key in fromStorage) {
				if (!(key in defaultSettings)) {
					delete fromStorage[key];
				}
			}
			localStorage.settings = JSON.stringify(fromStorage);
			return fromStorage;
		} else {
			return { ...defaultSettings };
		}
	})();

	$: settings && (localStorage.settings = JSON.stringify(settings));
	window.changeSettings = (e) => (settings = { ...settings, ...e });

	let selected = 1;
	let appState = "app";
	let viewerSrc = null;

	let ready = false;

	window.addEventListener("keydown", (e) => {
		let { key, target } = e;
		if (appState !== "app" || e.shiftKey) return;
		if (selected > 0) {
			if (/Arrow(Up|Down)/.test(key)) e.preventDefault(); //don't scroll
			if (/Enter/.test(key)) target.click();
		}
		if (
			selected == 0 &&
			(key == "Backspace" || key == "ArrowLeft" || key == "SoftLeft") &&
			(target.tagName !== "TEXTAREA" || target.value === "")
		) {
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
		if (key === "Backspace" && (selected === 2 || !ready) && confirm("Are you sure you want to exit the app?"))
			window.close();
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

	window.addEventListener("sn:focused", ({ target, detail, native }) => {
		if (appState !== "app" || selected !== 2) return;
		setTimeout(() => centerScroll(target), 50);
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

	const loadDMS = async () => {
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
				avatar:
					!icon && !avatar
						? "/css/default.png"
						: `https://cdn.discordapp.com/${icon ? "channel-icons" : "avatars"}/${icon ? id : user_id}/${
								icon || avatar
						  }.jpg`,
			};
		});
		sift.sort((a, b) => Number(b.last_message_id) - Number(a.last_message_id));
		channels = sift;
		console.log("dms:", channels);
		if (selected !== 1) selected = 1;
		setTimeout(() => sn.focus(), 50);
		return sift;
	};

	const loadChannels = async (noSwitch = false) => {
		if (!noSwitch) {
			discordGateway.send({
				op: 14,
				d: {
					activities: false,
					guild_id: guild.id,
					threads: true,
					typing: true,
				},
			});
			document.activeElement.blur();
			channels = [];
		}
		roles = await discord.getRoles(guild.id);
		serverProfile = await discord.getServerProfile(guild.id, discord.user.id);
		let raw = await discord.getChannels(guild.id);
		channels = siftChannels(raw, roles, serverProfile, roles).map((a) => {
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
		if (!noSwitch) {
			if (selected !== 1) selected = 1;
			setTimeout(() => sn.focus(), 50);
		}
		return channels;
	};

	$: guild === null && loadDMS();
	$: guild && loadChannels();

	const loadMessages = async (noSwitch = false) => {
		channelPermissions = channel.dm
			? {}
			: parseRoleAccess(
					channel.permission_overwrites,
					serverProfile.roles.concat([roles.find((p) => p.position == 0).id, serverProfile.user.id]),
					roles
			  );
		messages = [];
		let msgs = await discord.getMessages(channel.id, 30);
		messages = [...msgs].reverse();
		console.log("messages:", messages);
		if (!noSwitch) {
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
		}
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
					found
						? found.servers.push(a)
						: temp.push({ type: "folder", id: folder.id, servers: [a], color: folder.color, name: folder.name });
				} else temp.push(a);
			});

		servers = temp;
	}

	onMount(() => {
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
			if (!internet && !confirm("There seems to be no internet connection, do you want to retry connecting?"))
				return window.close();
			else attempts = -1;
			if (attempts == 5) {
				if (
					internet &&
					confirm(
						"The Discord gateway closed 5 times already! Do you want to retry connecting? You might get rate limited..."
					)
				) {
					attempts = -1;
				} else return window.close();
			}
			attempts++;
			discordGateway.init(localStorage.token);
			if (channel) loadMessages(true);
		});
	});

	const login = (e) => {
		appState = "app";
		localStorage.token = e;
		discord.login(e);
		discordGateway.init(e);
	};

	onMount(() => {
		const token = localStorage.token;
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

	const selectServer = async (e) => {
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
	discordGateway.once("t:ready", async () => {
		guild = null;
		ready = true;

		let { status } = discord.cache.user_settings;
		function sendCustomPresence() {
			if (status !== "invisible" && settings.custom_rpc) {
				const activities = [
					{
						name: "Discord4KaiOS",
						type: 0,
						details: "discord.gg/W9DF2q3Vv2",
						assets: {
							large_image: "mp:attachments/813030840526569472/987002874032713818/unknown.png",
							large_text: "https://github.com/cyan-2048/Discord4KaiOS/",
						},
					},
				];
				discordGateway.send({
					op: 3,
					d: {
						since: Date.now(),
						activities,
						status,
						afk: false,
					},
				});
			}
		}
		sendCustomPresence();
		discordGateway.on("t:user_settings_update", (d) => {
			if (discord.cache) Object.assign(discord.cache.user_settings, d);
			const newStat = discord.cache.user_settings.status;
			if (status !== newStat) {
				status = newStat;
				sendCustomPresence();
			}
		});

		await loadServers();
	});
	discordGateway.on("t:message_delete", (d) => {
		if (!channel) return;
		if (d.channel_id == channel.id && messages.find((e) => e.id == d.id)) {
			messages = messages.filter((m) => m.id != d.id);
		}
	});

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
	discordGateway.on("t:channel_unread_update", ({ channel_unread_updates: read_updates, guild_id }) => {
		if (!discord.cache) return;
		read_updates.forEach((state) => {
			let el = discord.cache.read_state.find((e) => e.id == state.id);
			if (el && el.last_message_id !== state.last_message_id) {
				el.last_message_id = state.last_message_id;
				serverAck.emit("update", state);
			}
		});
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
	discordGateway.on("t:channel_update", (d) => {
		if (d.guild_id) {
			const e = discord.cache.guilds.find((a) => a.id === d.guild_id);
			const sift = e.channels.find((e) => e.id === d.id);
			Object.assign(sift, d);
			if (guild && guild.id === d.guild_id) loadChannels(true);
		}
	});

	const spreadAuthor = (e) => {
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
					discordGateway.once("t:guild_members_chunk", (d) =>
						res(d.members.map((a) => ({ ...a, guild_id: guild.id })))
					);
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
			const xhr = new XMLHttpRequest({ mozSystem: true });
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
		const emoji = localStorage.getItem("emoji-font");
		initEmoji(emoji || "https://github.com/mozilla/twemoji-colr/releases/latest/download/TwemojiMozilla.ttf", !!!emoji);
	});

	discordGateway.on("t:typing_start", (d) => typingState.add(d));

	let statusBar = "#36393f";
	$: if (appState !== null && selected !== null) {
		if (appState === "app") {
			statusBar = selected === 0 ? "#36393f" : "#2f3136";
		}
	}
</script>

<svelte:head>
	<meta name="theme-color" content={statusBar} />
</svelte:head>
{#if ready}
	<Servers {appState} {selected}>
		<Server on:select={selectServer} selected={!guild} dm={true} />
		{#each servers as server (server.id)}
			{#if server.type === "folder"}
				<ServerFolder {guild} on:select={selectServer} {...server} />
			{:else}
				<Server on:select={selectServer} selected={guild?.id === server.id} {server} />
			{/if}
		{/each}
	</Servers>
	<Channels {appState} {selected}>
		{#if guild === null}
			<Separator>DIRECT MESSAGES</Separator>
		{/if}
		{#each channels as channel (channel.id || channel.name)}
			{#if channel.type !== "separator"}
				<Channel
					guildID={guild ? guild.id : null}
					on:select={async (e) => {
						let { id } = e.detail;
						let sift = channels.find((d) => d.id == id);
						if (sift && channel?.id != sift.id) {
							channel = sift;
						} else {
							selected = 0;
						}
					}}
					{...channel}>{channel.name || ""}</Channel
				>
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
		{sendMessage}
		{roles}
		{channel}
		{channelPermissions}
		{appState}
		{selected}
		guildID={guild ? guild.id : null}
	>
		{#each messages as message, i (message.id)}
			{#if i !== 0 && new Date(messages[i - 1].timestamp).toLocaleDateString("en-us") !== new Date(message.timestamp).toLocaleDateString("en-us")}
				<DateSeparator
					>{new Date(message.timestamp).toLocaleDateString([], {
						month: "long",
						day: "numeric",
						year: "numeric",
					})}
				</DateSeparator>
			{/if}
			{#if i === 0 || messages[i - 1]?.author.id != message.author?.id || (messages[i - 1] && (function diff_minutes(dt2, dt1) {
						var diff = (dt2.getTime() - dt1.getTime()) / 1000;
						diff /= 60;
						return Math.abs(Math.round(diff));
					})(new Date(messages[i - 1].timestamp), new Date(message.timestamp)) > 0)}
				<MessageSeparator
					{cachedMentions}
					userID={discord.user.id}
					{roles}
					{...spreadAuthor(message.author)}
					guildID={guild ? guild.id : null}
					{channel}
					profile={serverProfile}
				/>
			{/if}
			<Message
				on:update={(e) => (messages[i] = e.detail.message)}
				guildID={guild ? guild.id : null}
				{cachedMentions}
				{roles}
				{channel}
				profile={serverProfile}
				msg={message}
			/>
		{/each}
	</Messages>
{:else}
	<Loading />
{/if}
{#if appState === "login"}
	<Login on:login={(e) => login(e.detail.token)} />
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
