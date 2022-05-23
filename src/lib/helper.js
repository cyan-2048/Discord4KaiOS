// prettier-ignore
function hashCode(r){var n,t=String(r),o=0;if(0===t.length)return o;for(n=0;n<t.length;n++)o=(o<<5)-o+t.charCodeAt(n),o|=0;return Array.from(o.toString()).map(r=>"ledoshcyan"[r]).join("")}

let bitwise2text = {
	64: "write_reactions",
	1024: "read",
	2048: "write",
	8192: "mod_delete",
	32768: "attach",
	65536: "history",
	131072: "ping_everyone",
	262144: "ext_emojis",
	32: "ext_stickers",
	4: "mod_threads",
	8: "make_thread",
	16: "make_priv_thread",
	64: "write_thread",
};

function groupBy(arr, property) {
	return arr.reduce(function (memo, x) {
		if (!memo[x[property]]) {
			memo[x[property]] = [];
		}
		memo[x[property]].push(x);
		return memo;
	}, {});
}

// make getting roles more readble, i am not a robot
function parseRoleAccess(overwrites = [], roles = []) {
	let obj = {};
	let grouped = groupBy(overwrites, "type");
	Object.keys(grouped)
		.sort()
		.forEach((a) => {
			grouped[a].forEach((o) => {
				if (roles.includes(o.id)) {
					Object.entries(bitwise2text).forEach((ar) => {
						let [num, perm] = ar;
						if ((o.allow & num) == num) obj[perm] = true;
						if ((o.deny & num) == num) obj[perm] = false;
					});
				}
			});
		});
	return obj;
}

function wouldMessagePing(message, roles) {
	let check = (e) => e instanceof Array && !!e[0];
	let { mention_everyone, mentions, mention_roles, guild_id } = message;
	if (mention_everyone) return true;
	if (check(mentions) && mentions.find((a) => a.id == discord.user.id)) {
		return true;
	}
	if (check(mention_roles) && mention_roles.some((r) => roles.includes(r))) {
		return true;
	}
	return false;
}
function wouldMessagePingDM(message) {}

function siftChannels(raw, roles, profile, skipSeparators) {
	let position = (a, b) => a.position - b.position;
	let _channels = {
		0: [],
	};
	let separators = [];
	let channels_id = {};
	raw.forEach((a) => {
		if (a.type == 4) {
			_channels[a.name] = [];
			channels_id[a.id] = a.name;
			separators.push(a);
		}
	});
	separators.sort(position);
	separators = separators.map((a) => a.name);
	separators.unshift(0);

	raw.forEach((a) => {
		if (a.type == 0 || a.type == 5) {
			let perms = parseRoleAccess(a.permission_overwrites, profile.roles.concat([roles.find((p) => p.position == 0).id, profile.user.id]));
			let id = a.parent_id;
			if (perms.read !== false) (_channels[id ? channels_id[id] : 0] || []).push(a);
		}
	});

	Object.keys(_channels).forEach((a) => {
		if (_channels[a].length == 0) {
			_channels[a] = null; // playing safe
		} else {
			_channels[a].sort(position);
		}
	});

	let final = [];

	separators.forEach((a) => {
		if (_channels[a]) {
			if (!skipSeparators) final.push({ type: "separator", name: a });
			final = final.concat(_channels[a]);
		}
	});

	return final;
}

function findScrollParent(node) {
	if (node == null) return null;
	if (node.scrollHeight > node.clientHeight) return node;
	else return findScrollParent(node.parentNode);
}

function centerScroll(el, sync) {
	const rect = el.getBoundingClientRect();
	const elY = rect.top + rect.height / 2;
	findScrollParent(el)?.scrollBy({
		left: 0,
		top: elY - window.innerHeight / 2,
		behavior: sync ? "auto" : "smooth",
	});
}

function isChannelMuted(discordInstance, channel, guildID) {
	let settings = discordInstance.cache.user_guild_settings;
	let guild = settings.find((e) => e.guild_id === guildID);
	if (!guild) return false;
	let find = guild.channel_overrides.find((a) => a.channel_id === channel.id);
	if (find) return find.muted;
	return false;
}

let last = (e) => e[e.length - 1];

export { last, isChannelMuted, findScrollParent, centerScroll, siftChannels, hashCode, bitwise2text, groupBy, parseRoleAccess, wouldMessagePing, wouldMessagePingDM };
