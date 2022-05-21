((exports) => {
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
				xhr.open(method, this._fullUrl(url), true);

				const hdr = this._fixHeaders(headers);
				Object.entries(hdr).forEach((ent) => {
					let [a, b] = ent;
					if (a && b) xhr.setRequestHeader(a, b.replace(/\r?\n|\r/g, "")); // nodejs http bug
				});

				xhr.onload = () => res(xhr.responseText, xhr);
				xhr.onerror = rej;
				xhr.send(typeof data == "object" ? JSON.stringify(data) : data);
			});
		}

		xhrRequestJSON() {
			return this.xhrRequest(...arguments).then((x, xhr) => {
				try {
					return JSON.parse(x);
				} catch (e) {
					let error = new Error(e.message);
					error.xhr = xhr;
					error.responseText = x;
					return Promise.reject(error);
				}
			});
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

		sendMessage(channel, message, opts = {}) {
			return this.xhrRequestJSON("POST", `channels/${channel}/messages`, {}, Object.assign({ content: message, nonce: this.generateNonce() }, opts));
		}

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

		getServers() {
			if (this.cache) {
				return this._res(this.cache.guilds);
			}
			return this.xhrRequestJSON("GET", `users/@me/guilds`).then(
				(re) =>
					new Promise((res, err) => {
						let arr = [],
							len = re.length,
							terminate = () => {
								if (arr.length == len) res(arr);
							};
						re.forEach((a) => {
							this.getServer(a.id).then((o) =>
								setTimeout(() => {
									arr.push(o);
									terminate();
								}, 100)
							);
						});
					})
			);
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

		getMessages(channel, count) {
			return this.xhrRequestJSON("GET", `channels/${channel}/messages?limit=${count}`);
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
					if (e) return this._res(e);
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

	exports.DiscordXHR = DiscordXHR;
})(typeof exports === "undefined" ? this : exports);
