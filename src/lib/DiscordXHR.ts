// import structuredClone from "core-js/actual/structured-clone";

import { APIChannel, APIEmoji, APIGuildMember, APIUser, type APIGuild } from "discord-api-types/v9";

interface DiscordOptions {
	cache?: boolean;
}

interface GuildWithChannels extends APIGuild {
	channels: APIChannel[];
	members: APIGuildMember[];
}

// this.cache.
interface DiscordCache {
	guilds?: GuildWithChannels[];
	private_channels?: APIChannel[];
	user_settings?: any;
}

class StructuredCloner {
	pending = new Map();
	nextKey = 0;

	inPort: MessagePort;
	outPort: MessagePort;

	constructor() {
		const channel = new MessageChannel();
		this.inPort = channel.port1;
		this.outPort = channel.port2;

		this.outPort.onmessage = ({ data: { key, value } }) => {
			const resolve = this.pending.get(key);
			resolve(value);
			this.pending.delete(key);
		};
		this.outPort.start();
	}

	cloneAsync(value) {
		return new Promise((resolve) => {
			const key = this.nextKey++;
			this.pending.set(key, resolve);
			this.inPort.postMessage({ key, value });
		});
	}
}

function clonerInit(): (val: any) => Promise<any> {
	const _cloner = new StructuredCloner();
	return (val: any) => {
		if (typeof val !== "object") return val; // if it's non-serializable
		return _cloner.cloneAsync(val);
	};
}

const cloner = window.structuredClone || clonerInit();

function _res(obj: any) {
	return Promise.resolve(typeof obj === "object" ? cloner(obj) : obj);
}
function _clean(obj = {}): any {
	return Object.entries(obj)
		.filter(([_, v]) => v != null)
		.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}
function _query(obj = {}) {
	return Object.keys(obj)
		.map((key) => `${key}=${encodeURIComponent(obj[key])}`)
		.join("&");
}

// make storing tokens more secure
const tokens = new WeakMap();

export default class DiscordXHR {
	// private token: string | null;
	user: APIUser | null;
	cache: undefined | DiscordCache;

	constructor(options: DiscordOptions = {}) {
		// this.token = null;
		this.user = null;

		if (options.cache === true) {
			this.cache = { guilds: [], private_channels: [] };
		}
	}

	_fullUrl(path = "/") {
		const base = "https://discord.com";

		if (path.startsWith("http")) {
			return path;
		}

		if (path.startsWith("/")) {
			return base + path;
		}

		return `${base}/api/v9/${path}`;
	}

	async login(token: string) {
		tokens.set(this, token);
		if (!this.user) {
			this.user = await this.getProfile("@me");
		}
	}

	xhrRequest(method: string, url: string, headers: any = {}, data: any = null): Promise<XMLHttpRequest> {
		return new Promise((res, rej) => {
			// @ts-ignore
			const xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });
			if (method.toLowerCase() === "post") xhr.upload.onprogress = this._postProgress;
			xhr.open(method, this._fullUrl(url), true);

			const hdr = {
				"Content-Type": "application/json",
				authorization: tokens.get(this) || null,
				...headers,
			};
			Object.entries(hdr).forEach(([a, b]: any) => {
				if (a && b) xhr.setRequestHeader(a, b.replace(/\r?\n|\r/g, "")); // nodejs http bug
			});

			xhr.onload = () => res(xhr);
			xhr.onerror = () => rej(xhr);
			xhr.send(typeof data == "object" ? JSON.stringify(data) : data);
		});
	}

	async xhrRequestJSON(method: string, url: string, headers: any = {}, data: any = null) {
		let xhr: XMLHttpRequest | null = null;
		try {
			xhr = await this.xhrRequest.apply(this, arguments);
		} catch (e) {
			console.warn(e.status, e);
		}
		if (xhr === null) return { code: 0, args: [...arguments], message: "unknown error occured" };
		let parsed: string | any = xhr.responseText;
		try {
			parsed = (parsed && JSON.parse(parsed)) || {};
			Object.defineProperty(parsed, "httpStatus", { value: xhr.status, enumerable: false }); // if it's an array, we don't get an extra key
		} catch (e) {
			console.error("JSON.parse failed!", parsed, xhr.responseText);
			parsed = { httpStatus: xhr.status };
		}
		return parsed;
	}

	getAvatarURL(userId = "@me", avatarId: string | null | void = null): Promise<string> | string {
		if (avatarId === undefined) {
			return "/css/default.png";
		}
		if (!avatarId) {
			return (async () => {
				const x = await this.getProfile(userId);
				const user = x.user || x;
				if (!user.avatar) throw Error("no avatar");
				return this.getAvatarURL(user.id, user.avatar);
			})();
		}
		return `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.png?size=24`;
	}

	async getServerIcon(guildId: string, iconId: string | null = null) {
		if (!iconId) {
			const guilds = await this.getServers();
			const guild = guilds.find((k) => k.id.toString() == guildId);
			if (!guild) throw Error("Could not find guild!");
			if (!guild.icon) throw Error("no icon");
			return this.getServerIcon(guild.id, guild.icon);
		}
		return `https://cdn.discordapp.com/icons/${guildId}/${iconId}.webp?size=96`;
	}

	generateNonce() {
		return String(Date.now() * 512 * 1024);
	}

	_postProgress(evt) {
		if (!evt.lengthComputable) return;
		console.info("POST progress:", (evt.loaded / evt.total) * 100);
	}

	/**
	 * @returns returns an xhr if you have attachments
	 */
	sendMessage(
		channel: string,
		message = "",
		opts: any = {},
		attachments: null | File[] = null
	): Promise<any> | XMLHttpRequest | void {
		if (!message && !attachments && !tokens.get(this)) return;

		const obj: any = { content: message.trim(), nonce: this.generateNonce(), ...opts };
		const url = `channels/${channel}/messages`;

		if (!attachments) return this.xhrRequestJSON("POST", url, {}, obj);

		const form = new FormData();

		obj.attachments = [];
		const len = attachments.length;
		for (let id = 0; id < len; id++) {
			const file = attachments[id];
			obj.attachments.push({ id, filename: file.name || "blob" });
			form.append(`files[${id}]`, file);
		}

		form.append("payload_json", JSON.stringify(obj));

		// @ts-ignore
		const xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });
		xhr.upload.onprogress = this._postProgress;
		xhr.open("POST", this._fullUrl(url), true);
		// @ts-ignore
		xhr.setRequestHeader("authorization", tokens.get(this));
		xhr.send(form);
		return xhr;
	}

	editMessage(channel_id: string, message_id: string, message: string, opts: any = {}) {
		return this.xhrRequestJSON(
			"PATCH",
			`channels/${channel_id}/messages/${message_id}`,
			{},
			Object.assign({ content: message.trim() }, opts)
		);
	}

	_emojiURI(emoji: APIEmoji | string) {
		const en = encodeURIComponent;
		if (typeof emoji === "object") {
			return emoji.id ? en(emoji.name + ":" + emoji.id) : en(emoji.name || "");
		}
		return en(String(emoji));
	}

	reaction(method: string, channelID: string, messageID: string, emoji: APIEmoji | string, user = "@me") {
		return this.xhrRequestJSON(
			method,
			`channels/${channelID}/messages/${messageID}/reactions/${this._emojiURI(emoji)}/${user}`
		);
	}

	addReaction() {
		// @ts-ignore
		return this.reaction("PUT", ...arguments);
	}

	removeReaction() {
		// @ts-ignore
		return this.reaction("DELETE", ...arguments);
	}

	deleteMessage(channel_id: string, message_id: string) {
		return this.xhrRequestJSON("DELETE", `channels/${channel_id}/messages/${message_id}`);
	}

	/**
	 * @param {string|number} serverId the guild_id
	 * @description get a server the same way the discord gateway caches it
	 */
	async getServer(serverId: string): Promise<GuildWithChannels> {
		if (this.cache) {
			let e = this.cache.guilds?.find((a) => a.id == serverId);
			if (e) return _res(e);
		}

		const r: GuildWithChannels = await this.xhrRequestJSON("GET", "guilds/" + serverId);
		const re = await this.getChannels(serverId);
		r.channels = re;
		return r;
	}

	/**
	 * @param noCache to use cache or to not use cache
	 */
	async getServers(noCache = false): Promise<GuildWithChannels[]> {
		if (this.cache && !noCache) {
			return _res(this.cache.guilds);
		}
		const re: APIGuild[] = await this.xhrRequestJSON("GET", `users/@me/guilds`);

		return Promise.all(re.map(({ id }) => this.getServer(id)));
	}

	getSettings() {
		if (this.cache) {
			return _res(this.cache.user_settings);
		}
		return this.xhrRequestJSON("GET", "users/@me/settings");
	}

	getChannel(channelId: string): Promise<APIChannel> {
		if (this.cache) {
			let e;
			this.cache.guilds?.find((a) => (e = a.channels.find((a) => a.id == channelId)));
			if (e) return _res(e);
			const dm = this.cache.private_channels?.find((a) => a.id === channelId);
			if (dm) return _res(dm);
		}

		return this.xhrRequestJSON("GET", `channels/${channelId}`);
	}

	_isProperArray(arr: any): boolean {
		return arr && arr instanceof Array && arr.length != 0;
	}

	async getChannels(guildId: string): Promise<APIChannel[]> {
		if (this.cache) {
			let e = this.cache.guilds?.find((a) => a.id == guildId);
			if (e && this._isProperArray(e.channels)) return _res(e.channels);
		}
		return this.xhrRequestJSON("GET", `guilds/${guildId}/channels`);
	}

	async getChannelsDM() {
		// return _res((await (this.cache?.private_channels || this.xhrRequestJSON("GET", "users/@me/channels"))) || []);
		return _res(await (this.cache?.private_channels || this.xhrRequestJSON("GET", "users/@me/channels")));
	}

	/**
	 * @param channel channel_id
	 * @param limit how many messages to download
	 * @param before getMessages before this messageId
	 */
	getMessages(channel: number | string, limit: number | string | null = null, before: number | string | null = null) {
		// console.error(_query(_clean({ limit, before })), _clean({ limit, before }));
		return this.xhrRequestJSON("GET", `channels/${channel}/messages?` + _query(_clean({ limit, before })));
	}

	getRoles(guildId: string) {
		if (this.cache) {
			let e = this.cache.guilds?.find((a) => a.id == guildId);
			if (e && this._isProperArray(e.roles)) return _res(e.roles);
		}
		return this.xhrRequestJSON("GET", `guilds/${guildId}/roles`);
	}

	getServerProfile(guildId: string, userId: string) {
		if (this.cache) {
			let g = this.cache.guilds?.find((a) => a.id == guildId);
			if (g) {
				let e = g.members.find((a) => a.user?.id == userId);
				if (e) return _res({ ...e, guild_id: guildId });
			}
		}
		return this.xhrRequestJSON("GET", `guilds/${guildId}/members/${userId == "@me" ? this.user?.id : userId}`);
	}

	getProfile(userId: string) {
		if (userId == "@me" && this.user) return Promise.resolve(this.user);
		let url = `users/${userId}`;
		if (userId != "@me") url += "/profile";
		return this.xhrRequestJSON("GET", url);
	}
}
