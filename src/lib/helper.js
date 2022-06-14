// prettier-ignore
function hashCode(r){var n,t=String(r),o=0;if(0===t.length)return o;for(n=0;n<t.length;n++)o=(o<<5)-o+t.charCodeAt(n),o|=0;return Array.from(o.toString()).map(r=>"ledoshcyan"[r]).join("")}

let bitwise2text = {
	64: "add_reactions",
	8: "admin",
	1024: "read",
	2048: "write",
	8192: "manage_messages",
	32768: "attach",
	65536: "history",
	131072: "ping_everyone",
	262144: "ext_emojis",
	137438953472: "ext_stickers",
	17179869184: "manage_threads",
	34359738368: "make_pub_thread",
	68719476736: "make_priv_thread",
	274877906944: "write_thread",
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
function parseRoleAccess(overwrites = [], roles = [] /*this is the roles the user has*/, serverRoles = []) {
	let obj = {};
	if (serverRoles.length > 0)
		[...serverRoles]
			.sort((a, b) => a.position - b.position)
			.filter((o) => roles.includes(o.id) || roles.position === 0)
			.map((o) => o.permissions)
			.forEach((perms) => {
				Object.entries(bitwise2text).forEach(([num, perm]) => {
					if ((num & perms) == num) obj[perm] = true;
				});
			});
	if (obj.admin === true) {
		Object.values(bitwise2text).forEach((a) => (obj[a] = true));
		console.error("person is admin, gib all perms true", obj);
		return obj;
	}
	let grouped = groupBy(overwrites, "type");
	Object.keys(grouped)
		.sort()
		.forEach((a) => {
			grouped[a].forEach((o) => {
				if (roles.includes(o.id)) {
					Object.entries(bitwise2text).forEach(([num, perm]) => {
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

import scrollIntoView from "scroll-into-view";

function centerScroll(el, sync) {
	scrollIntoView(el, { time: sync ? 0 : 300, align: { left: 0 } });
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
		const mentionCache = [...args].map((a) => Object.values(a)).flat(2);
		const copy = (tag.startsWith("@") ? tag.slice(1) : tag).split("#");
		let done = null;
		let len = mentionCache.length;
		for (let index = 0; index < len; index++) {
			const test = mentionCache[index];
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

// returns a function that waits for another function to finish before running
// also has caching abilities
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

// returns a function which has a caching ability
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

// calculate the outputed color if a color has opacity
// returns a color in hex
function rgbaToHex(d = [0, 0, 0], b = [0, 0, 0], a = 1) {
	var r = Math.floor(d[0] * a + b[0] * (1 - a));
	var g = Math.floor(d[1] * a + b[1] * (1 - a));
	var b = Math.floor(d[2] * a + b[2] * (1 - a));
	return "#" + ((r << 16) | (g << 8) | b).toString(16);
}

// returns async function in which there's a limit to how many executions can be done
// if number of unfinished request exceeds limit,
// we wait for a request to finish before executing another
// also caches
function asyncRateLimitGenerator(func, limit = 5) {
	const cache = {};
	let current = 0;
	function delay(timeout) {
		return new Promise((res) => setTimeout(res, timeout));
	}
	const final = async function () {
		const args = [...arguments];
		const hash = hashCode(args.join(""));
		if (cache[hash]) return cache[hash];
		while (current >= limit && !cache[hash]) {
			const min = 100,
				max = 500;
			await delay(1000 + Math.random() * (max - min) + min);
		}
		if (cache[hash]) return cache[hash];
		current += 1;
		const wait = await func(...args);
		current -= 1;
		return (cache[hash] = wait);
	};
	final.cache = cache;
	return final;
}

let decideHeight = (e, size, minus) => {
	if (!e || typeof e !== "object") return {};
	let { height, width } = e;
	if (!height || !width) return {};
	if (minus && height - minus > 0 && width - minus > 0) {
		height -= minus;
		width -= minus;
	}
	if ((width || 0) > (size || 203)) {
		return {
			width: size || 203,
			height: (height / width) * (size || 203),
		};
	} else return { height, width };
};

function syncCachedGenerator(func) {
	const cache = {};
	return function () {
		let args = [...arguments];
		return cache[hashCode(args.join(""))] || (cache[hashCode(args.join(""))] = func(...args));
	};
}
/**
 * @param {Blob|File|string} blob 
 */
function downloadFile(blob, filename = ""){
	const url = (typeof blob === "string" && blob) || URL.createObjectURL(blob);
	const el = document.createElement("a");
	el.href = url;
	el.download = blob.name || filename;
	el.click();
	URL.revokeObjectURL(url);
}

export {
	downloadFile,
	syncCachedGenerator,
	decideHeight,
	asyncRateLimitGenerator,
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
