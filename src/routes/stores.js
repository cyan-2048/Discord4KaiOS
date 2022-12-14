import { get, writable } from "svelte/store";

export const mountDirection = writable(null);

export const messages = writable([]);
export const _guildID = writable("@me");
export const _channelID = writable(null);
export const _channel = writable(null);
export const typingState = writable([]);

export const special_people = writable(null);
export const dev_people = writable(null);

import { discordGateway, discord, serverAck } from "../lib/database";
import { navigate, wouldMessagePing } from "../lib/helper";
import { self, serverProfiles, settings, userProfiles } from "../lib/shared";

export const showAds = writable(true);
self.then((e) => showAds.set(Boolean(e?.installOrigin == "app://kaios-plus.kaiostech.com")));

// settings.init.then(() => get(settings)?.devmode && true);

import TypingState from "../lib/TypingState";

const typingStateInstance = new TypingState();

discordGateway.on("t:typing_start", (event) => {
	var { detail: d } = event || {};
	typingStateInstance.add(d);
});

function typingChange({ detail, ...object }) {
	const { state, id } = detail || object || {};

	if (id === get(_channelID)) {
		typingState.set(
			state
				.map((userID) => {
					if (userID === discord.user.id) return null;
					const profiles = get(serverProfiles);
					const users = get(userProfiles);
					const guildID = get(_guildID);

					const profile = profiles.get(guildID + "/" + userID);
					const user = profile?.user?.username || users.get(userID)?.username;

					return profile?.nick || user || null;
				})
				.filter((e) => e)
		);
	}
}

_channelID.subscribe((channelID) => {
	typingChange(typingStateInstance.getState(channelID));
});

typingStateInstance.on("change", typingChange);

discordGateway.on("t:message_create", async (event) => {
	var { detail: d } = event || {};

	if (get(_channelID) === d.channel_id) {
		messages.update((arr) => [...arr, d]);
	}

	let found = false;
	for (const guild of discord.cache.guilds) {
		const channel = guild.channels.find((a) => a.id == d.channel_id);
		if (channel) {
			channel.last_message_id = d.id;
			found = true;
			break;
		}
	}

	if (!found) {
		const dm = discord.cache.private_channels.find((a) => a.id === d.channel_id);
		dm && (dm.last_message_id = d.id);
	}

	let el = discord.cache.read_state.find((e) => e.id == d.channel_id);
	if (d.guild_id) {
		let r =
			get(serverProfiles).get(d.guild_id + "/" + discord.user.id) ||
			(await discord.getServerProfile(d.guild_id, discord.user.id));
		let ping = wouldMessagePing(d, r.roles, discord.user.id);
		if (el && ping) el.mention_count++;
	}

	serverAck.emit("update", d);
});

class FilePickerInstance {
	constructor(maxbytes = Infinity, cb = () => {}) {
		this.max = maxbytes;
		this.cb = cb;
	}

	files = writable([]);

	removeFile(index) {
		if (get(this.files).includes(index)) {
			this.files.update((arr) => arr.filter((a) => a !== index));
			return;
		}
		if (index === -1) return this.files.set([]);
		this.files.update((arr) => arr.filter((a, i) => i !== index));
	}
	addFile(blob) {
		if (blob && blob instanceof Blob) {
			if (blob.size > this.max) return this.cb(blob);
			this.files.update((arr) => [...arr, blob]);
			return;
		}
		if (window.mozActivity) {
			const self = this;
			new MozActivity({ name: "pick" }).onsucess = function () {
				self.addFile(this.result.blob);
			};
		} else {
			let input = document.createElement("input");
			input.type = "file";
			input.onchange = () => {
				this.addFile(...input.files);
				input.onchange = null;
				input = null;
			};
			input.click();
		}
	}
}

export const picker = new FilePickerInstance();
