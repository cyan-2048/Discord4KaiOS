import { navigate } from "svelte-routing";
import { get, writable } from "svelte/store";
import DiscordXHR from "./DiscordXHR";
import { testInternet, delay, wouldMessagePing, reload, Promise_defer } from "./helper";
import { serverProfiles, settings, userProfiles, queryProfiles } from "./shared";

import EventEmitter from "./EventEmitter.js";

export const serverAck = new EventEmitter();

export const discord = new DiscordXHR({ cache: true });

const discordWorker = new Worker("/worker.js");

export const localStorage = window.localStorage;
delete window.localStorage;

class _gateway extends EventEmitter {
	constructor() {
		super();
		discordWorker.onmessage = (e) => {
			let { event, args } = e.data;
			this.emit(event, ...args);
		};
	}
	init(token) {
		!PRODUCTION && console.log("init worker (global scope)");
		this.token = token;
		discordWorker.postMessage({ event: "init", token });
	}
	send(object) {
		discordWorker.postMessage({ event: "send", object });
	}
	close() {
		discordWorker.terminate();
	}
	debug(debug = false) {
		discordWorker.postMessage({ event: "debug", object: { debug } });
	}
}

export const discordGateway = new _gateway();

export async function ack(channelID) {
	const { last_message_id } = await discord.getChannel(channelID);
	if (last_message_id !== null) discord.xhrRequestJSON("post", `channels/${channelID}/messages/${last_message_id}/ack`, {}, { token: "null" });
}

const readyEventHappened = Promise_defer();

export async function isServerOwner(serverID) {
	await readyEventHappened.promise;
	return (await discord.getServer(serverID)).owner_id == discord.user.id;
}

//
// SERVER ACK STUFF
//

discordGateway.on("t:presence_update", (event) => {
	var { detail: d } = event || {};

	if (!discord.cache) return;
	let e = discord.cache.guilds.find((a) => a.id == d.guild_id);
	if (e) {
		let ix = e.presences.findIndex((a) => a.user.id == d.user.id);
		if (ix > -1) e.presences[ix] = d;
		else e.presences.push(d);
	}
	serverAck.emit("status", d);
});
discordGateway.on("t:message_ack", (event) => {
	var { detail: a } = event || {};

	let el = discord.cache.read_state.find((e) => e.id == a.channel_id);
	if (el) {
		el.last_message_id = a.message_id;
		el.mention_count = 0;
	}

	serverAck.emit("update", a);
});
discordGateway.on("t:channel_unread_update", (event) => {
	var { channel_unread_updates: read_updates, guild_id } = event?.detail || {};
	if (!discord.cache) return;
	read_updates.forEach((state) => {
		let el = discord.cache.read_state.find((e) => e.id == state.id);
		if (el && el.last_message_id !== state.last_message_id) {
			el.last_message_id = state.last_message_id;
			serverAck.emit("update", state);
		}
	});
});

discordGateway.on("t:user_guild_settings_update", (event) => {
	var { detail: d } = event || {};
	let m = discord.cache.user_guild_settings;
	let ix = m.findIndex((a) => a.guild_id == d.guild_id);
	if (ix > -1) m[ix] = d;
	else m.push(d);
	serverAck.emit("update", d);
});

//
// READY EVENTS
//

discordGateway.on("t:ready", ({ detail: a }) => {
	discord.user = a.user;
	let { user_settings, guilds, private_channels, read_state, user_guild_settings } = a;
	Object.assign(discord.cache, { user_settings, private_channels, guilds, read_state, user_guild_settings });
});

discordGateway.once("t:ready", async function ready_ev() {
	let { status } = discord.cache.user_settings;

	function sendCustomPresence() {
		if (status !== "invisible" && get(settings).custom_rpc) {
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
		Object.assign(discord.cache.user_settings, d);
		const newStat = discord.cache.user_settings.status;
		if (status !== newStat) {
			status = newStat;
			sendCustomPresence();
		}
	});

	await delay(10);
	readyEventHappened.resolve();
});

//
// channel updates
//

export const channelUpdates = new EventEmitter();

discordGateway.on("t:channel_update", (event) => {
	var { detail: d } = event || {};

	if (d.guild_id) {
		const e = discord.cache.guilds.find((a) => a.id === d.guild_id);
		const ix = e.channels.findIndex((e) => e.id === d.id);
		if (ix > -1) {
			e.channels[ix] = d;
		} else e.channels.push(d);
		channelUpdates.emit("update", d);
	} else {
		const e = discord.cache.private_channels;
		const ix = e.findIndex((a) => a.id === d.id);
		if (ix > -1) {
			e[ix] = d;
		} else e.push(d);
		channelUpdates.emit("update", { ...d, guild_id: "@me" });
	}
});
discordGateway.on("t:channel_delete", (event) => {
	var { detail: d } = event || {};

	if (d.guild_id) {
		const e = discord.cache.guilds.find((a) => a.id === d.guild_id);
		const ix = e.channels.findIndex((e) => e.id === d.id);
		if (ix > -1) {
			e.channels.splice(ix, 1);
		}
		channelUpdates.emit("update", d);
	}
});
discordGateway.on("t:channel_create", (event) => {
	var { detail: d } = event || {};

	if (d.guild_id) {
		const e = discord.cache.guilds.find((a) => a.id === d.guild_id);
		const ix = e.channels.findIndex((e) => e.id === d.id);
		if (ix === -1) {
			e.channels.push(d);
		}
		channelUpdates.emit("update", d);
	}
});

///////////////////////////////
/// guild_members
///////////////////////////////

discordGateway.on("t:guild_member_update", (event) => {
	var { detail: d } = event || {};
	const { user } = d;
	serverProfiles.update((map) => map.set(d.guild_id + "/" + user.id, d));
	userProfiles.update((e) => e.set(user.id, user));
});

discordGateway.on("t:guild_members_chunk", (event) => {
	var { detail: d } = event || {};

	if (!d.guild_id) return;
	d.members.forEach((profile) => {
		const { user } = profile;
		const profiles = get(serverProfiles);
		const key = d.guild_id + "/" + user.id;

		serverProfiles.set(profiles.set(key, profile));
		userProfiles.update((e) => e.set(user.id, user));
	});
	d.not_found?.forEach?.((id) => queryProfiles.delete(id));
});

discordGateway.on("close", () => {
	discordGateway.close();
	reload();
});

/// functions here

export async function testToken(authorization) {
	const settings = await discord.xhrRequestJSON("GET", "users/@me", { authorization });
	if (settings.code === 0) return false;
	return true;
}

export async function init() {
	const { token } = localStorage;

	let internet = false;

	while (internet === false) {
		internet = await testInternet();
	}

	sessionStorage.sessions = Number(sessionStorage.sessions || 0) + 1;

	if (token && (await testToken(token))) {
		discord.login(token);

		discordGateway.init(token);
		discordGateway.debug(get(settings).devmode);

		return await new Promise((res) => {
			discordGateway.once("t:ready", function ready_ev() {
				res(true);
				navigate("/channels/@me", { replace: true });
			});
		});
	} else {
		navigate("/login", { replace: true });
		return false;
	}
}
