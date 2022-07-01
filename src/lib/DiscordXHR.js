class DiscordXHR {
	constructor(options = {}) {
		this.token = null;
		this.user = null;

		if (options.cache === true) {
			this.cache = {};
		}
	}

	_res(obj) {
		return Promise.resolve(typeof obj === "object" ? JSON.parse(JSON.stringify(obj)) : obj);
	}

	_fixHeaders(headers) {
		let obj = {};
		obj["Content-Type"] = "application/json";
		if (this.token) obj.authorization = this.token;
		return Object.assign(obj, headers || {});
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

	login(token) {
		this.token = token;
		if (!this.user)
			this.getProfile("@me").then((x) => {
				this.user = x;
			});
	}

	xhrRequest(method, url, headers = {}, data = null) {
		return new Promise((res, rej) => {
			const xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });
			if (method.toLowerCase() === "post") xhr.upload.onprogress = this._postProgress;
			xhr.open(method, this._fullUrl(url), true);

			const hdr = this._fixHeaders(headers);
			Object.entries(hdr).forEach((ent) => {
				let [a, b] = ent;
				if (a && b) xhr.setRequestHeader(a, b.replace(/\r?\n|\r/g, "")); // nodejs http bug
			});

			xhr.onload = () => res(xhr);
			xhr.onerror = () => rej(xhr);
			xhr.send(typeof data == "object" ? JSON.stringify(data) : data);
		});
	}

	async xhrRequestJSON() {
		let xhr = null;
		try {
			xhr = await this.xhrRequest(...arguments);
		} catch (e) {
			console.warn(e.status, e);
		}
		if (xhr === null) return { args: [...arguments], message: "unknown error occured" };
		let parsed = xhr.responseText;
		try {
			parsed = (parsed && JSON.parse(parsed)) || {};
			Object.defineProperty(parsed, "httpStatus", { value: xhr.status, enumerable: false }); // if it's an array, we don't get an extra key
		} catch (e) {
			console.error("JSON.parse failed!", parsed, xhr.responseText);
			parsed = { httpStatus: xhr.status };
		}
		return parsed;
	}

	getAvatarURL(userId = "@me", avatarId = null) {
		if (!avatarId)
			return this.getProfile(userId).then((x) => {
				const user = x.user || x;
				if (!user.avatar) throw Error("no avatar");
				return this.getAvatarURL(user.id, user.avatar);
			});
		else return Promise.resolve(`https://cdn.discordapp.com/avatars/${userId}/${avatarId}.png?size=24`);
	}

	getServerIcon(guildId, iconId = null) {
		if (!iconId)
			return this.getServers().then((guilds) => {
				const guild = guilds.find((k) => k.id.toString() == guildId);
				if (!guild) throw Error("Could not find guild!");
				if (!guild.icon) throw Error("no icon");
				return this.getServerIcon(guild.id, guild.icon);
			});
		else return Promise.resolve(`https://cdn.discordapp.com/icons/${guildId}/${iconId}.webp?size=96`);
	}

	generateNonce() {
		return String(Date.now() * 512 * 1024);
	}

	_postProgress(evt) {
		if (!evt.lengthComputable) return;
		console.info("POST progress:", (evt.loaded / evt.total) * 100);
	}

	/**
	 * @param {String|Number} channel
	 * @param {String} message
	 * @param {object} opts
	 * @param {File[]|Blob[]} attachments
	 * @returns {Promise<object|XMLHttpRequest>} returns an xhr if you have attachments
	 */
	async sendMessage(channel, message = "", opts = {}, attachments = null) {
		if (!message) return;

		const obj = { content: message, nonce: this.generateNonce(), ...opts };
		const url = `channels/${channel}/messages`;

		if (!attachments) return await this.xhrRequestJSON("POST", url, {}, obj);

		const form = new FormData();

		obj.attachments = [];
		const len = attachments.length;
		for (let id = 0; id < len; id++) {
			const file = attachments[id];
			obj.attachments.push({ id, filename: file.name || "blob" });
			form.append(`files[${id}]`, file);
		}

		form.append("payload_json", JSON.stringify(obj));

		const xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });
		xhr.upload.onprogress = this._postProgress;
		xhr.open("POST", this._fullUrl(url), true);
		xhr.setRequestHeader("authorization", this.token);
		xhr.send(form);
		return xhr;
	}

	editMessage(channel_id, message_id, message, opts = {}) {
		return this.xhrRequestJSON(
			"PATCH",
			`channels/${channel_id}/messages/${message_id}`,
			{},
			Object.assign({ content: message }, opts)
		);
	}

	deleteMessage(channel_id, message_id) {
		return this.xhrRequestJSON("DELETE", `channels/${channel_id}/messages/${message_id}`);
	}

	/**
	 * @param {string|number} serverId the guild_id
	 * @description get a server the same way the discord gateway caches it
	 */
	getServer(serverId) {
		if (this.cache) {
			let e = this.cache.guilds.find((a) => a.id == serverId);
			if (e) return this._res(e);
		}
		return discord.xhrRequestJSON("get", "guilds/" + serverId).then((r) =>
			this.getChannels(serverId).then((re) => {
				r.channels = re;
				return r;
			})
		);
	}

	/**
	 * @param {boolean} noCache to use cache or to not use cache
	 */
	async getServers(noCache) {
		if (this.cache && !noCache) {
			return this._res(this.cache.guilds);
		}
		const re = await this.xhrRequestJSON("GET", `users/@me/guilds`);
		const arr = [];
		const len = re.length;
		for (let i = 0; i < len; i++) {
			arr.push(await this.getServer(re[i].id));
		}
		return arr;
	}

	getSettings() {
		if (this.cache) {
			return this._res(this.cache.user_settings);
		}
		return this.xhrRequestJSON("GET", "users/@me/settings");
	}

	getChannel(channelId) {
		if (this.cache) {
			let e;
			this.cache.guilds.find((a) => (e = a.channels.find((a) => a.id == channelId)));
			if (e) return this._res(e);
		}
		return this.xhrRequestJSON("GET", `channels/${channelId}`);
	}

	_isProperArray(arr) {
		return arr && arr instanceof Array && arr.length != 0;
	}

	getChannels(guildId) {
		if (this.cache) {
			let e = this.cache.guilds.find((a) => a.id == guildId);
			if (e && this._isProperArray(e.channels)) return this._res(e.channels);
		}
		return this.xhrRequestJSON("GET", `guilds/${guildId}/channels`);
	}

	getChannelsDM() {
		return this.xhrRequestJSON("GET", "users/@me/channels");
	}

	_query(obj = {}) {
		return new URLSearchParams(obj).toString();
	}

	_clean(obj = {}) {
		return Object.entries(obj)
			.filter(([_, v]) => v != null)
			.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
	}

	/**
	 * @param {number|string} channel channel_id
	 * @param {number|string} limit how many messages to download
	 * @param {number|string} before getMessages before this messageId
	 */
	getMessages(channel, limit = null, before = null) {
		return this.xhrRequestJSON("GET", `channels/${channel}/messages?` + this._query(this._clean({ limit, before })));
	}

	getRoles(guildId) {
		if (this.cache) {
			let e = this.cache.guilds.find((a) => a.id == guildId);
			if (e && this._isProperArray(e.roles)) return this._res(e.roles);
		}
		return this.xhrRequestJSON("GET", `guilds/${guildId}/roles`);
	}
	// yeah sorry i am a normal human being who doesn't say "guilds" for servers
	getServerProfile(guildId, userId) {
		if (this.cache) {
			let g = this.cache.guilds.find((a) => a.id == guildId);
			if (g) {
				let e = g.members.find((a) => a.user.id == userId);
				if (e) return this._res({ ...e, guild_id: guildId });
			}
		}
		return this.xhrRequestJSON("GET", `guilds/${guildId}/members/${userId == "@me" ? this.user.id : userId}`);
	}

	getProfile(userId) {
		if (userId == "@me" && this.user) return Promise.resolve(this.user);
		let url = `users/${userId}`;
		if (userId != "@me") url += "/profile";
		return this.xhrRequestJSON("GET", url);
	}
}

export { DiscordXHR };
