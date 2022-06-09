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

function wouldMessagePing(message, roles, discordInstance) {
	let check = (e) => e instanceof Array && !!e[0];
	let { mention_everyone, mentions, mention_roles, guild_id } = message;
	if (mention_everyone) return true;
	if (check(mentions) && mentions.find((a) => a.id == discordInstance.user.id)) {
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
	let e = findScrollParent(el);
	if (!e || e === el) e = el.parentNode;
	e.scrollBy({
		left: 0,
		top: elY - e.offsetHeight / 2,
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
function decimal2rgb(ns, arr) {
	let r = Math.floor(ns / (256 * 256)),
		g = Math.floor(ns / 256) % 256,
		b = ns % 256;
	return arr ? [r, g, b] : { r, g, b };
}

let toHTML = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

function shuffle(array) {
	let currentIndex = array.length,
		randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}

function inViewport(element, partial) {
	let bounding = element.getBoundingClientRect();
	let height = element.offsetHeight;
	let width = element.offsetWidth;
	return partial
		? !!(bounding.top >= -height && bounding.left >= -width && bounding.right <= window.innerWidth + width && bounding.bottom <= window.innerHeight + height)
		: !!(bounding.top >= 0 && bounding.left >= 0 && bounding.right <= window.innerWidth && bounding.bottom <= window.innerHeight);
}

function getTopBottom(el) {
	let bounding = el.getBoundingClientRect();
	return {
		top: bounding.top,
		bottom: window.innerHeight - bounding.top - el.offsetHeight,
	};
}

function getScrollBottom(el) {
	return el.scrollHeight - el.offsetHeight - el.scrollTop;
}

function findUserByTag() {
	const args = arguments;
	return function (tag) {
		const mentionCache = Object.assign({}, ...args);
		const copy = (tag.startsWith("@") ? tag.slice(1) : tag).split("#");
		let done = null;
		for (const key in mentionCache) {
			let test = mentionCache[key];
			let user = test?.user;
			if (!user || !(user.username && user.discriminator)) continue;
			let { discriminator: tag, username: name, id } = user;
			if (name === copy[0] && tag === copy[1]) {
				done = id;
				break;
			}
		}
		return done;
	};
}

let dblclick = (el, bubbles = false) =>
	el.dispatchEvent(
		new MouseEvent("dblclick", {
			view: window,
			bubbles,
			cancelable: true,
		})
	);

function asyncQueueGenerator(func) {
	const cache = {};
	let pending = Promise.resolve();
	const run = async function () {
		const args = [...arguments];
		try {
			await pending;
		} finally {
			return (cache[hashCode(args.join(""))] = await func(...arguments));
		}
	};
	const final = function () {
		let args = [...arguments];
		return cache[hashCode(args.join(""))] || (pending = run(...args));
	};
	final.cache = cache;
	return final;
}

function asyncCachedGenerator(func) {
	const cache = {};
	const final = async function () {
		let args = [...arguments];
		const hash = hashCode(args.join(""));
		return cache[hash] || (cache[hash] = await func(...args));
	};
	final.cache = cache;
	return final;
}

function rgbaToHex(d, b, a) {
	var r = Math.floor(d[0] * a + b[0] * (1 - a));
	var g = Math.floor(d[1] * a + b[1] * (1 - a));
	var b = Math.floor(d[2] * a + b[2] * (1 - a));
	return "#" + ((r << 16) | (g << 8) | b).toString(16);
}

export {
	asyncCachedGenerator,
	rgbaToHex,
	asyncQueueGenerator,
	dblclick,
	findUserByTag,
	getScrollBottom,
	getTopBottom,
	inViewport,
	shuffle,
	toHTML,
	decimal2rgb,
	last,
	isChannelMuted,
	findScrollParent,
	centerScroll,
	siftChannels,
	hashCode,
	bitwise2text,
	groupBy,
	parseRoleAccess,
	wouldMessagePing,
	wouldMessagePingDM,
};
