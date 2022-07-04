export function hashCode(r) {
	var n,
		t = String(r),
		o = 0;
	if (0 === t.length) return o;
	for (n = 0; n < t.length; n++) (o = (o << 5) - o + t.charCodeAt(n)), (o |= 0);
	return Array.from(o.toString())
		.map((r) => "ledoshcyan"[r])
		.join("");
}

export const bitwise2text = {
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

export function groupBy(arr, property) {
	return arr.reduce(function (memo, x) {
		if (!memo[x[property]]) {
			memo[x[property]] = [];
		}
		memo[x[property]].push(x);
		return memo;
	}, {});
}

// make getting roles more readble, i am not a robot
export function parseRoleAccess(overwrites = [], roles = [] /*this is the roles the user has*/, serverRoles = []) {
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

export function wouldMessagePing(message, roles, discordInstance) {
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
export function wouldMessagePingDM(message) {}

export function siftChannels(raw, roles, profile, skipSeparators, serverRoles = []) {
	let position = (a, b) => a.position - b.position;
	let sorted = [...raw].sort(position);
	let channels = { 0: [] };

	sorted.forEach((a) => {
		if (a.type == 4) {
			channels[a.id] = [{ ...a, type: "separator" }];
		}
	});

	sorted.forEach((a) => {
		if (a.type == 0 || a.type == 5) {
			let perms = parseRoleAccess(
				a.permission_overwrites,
				profile.roles.concat([roles.find((p) => p.position == 0).id, profile.user.id]),
				serverRoles
			);
			let id = a.parent_id;
			if (perms.read !== false) (channels[id] || channels[0] || []).push(a);
		}
	});

	let final = [];
	Object.values(channels).forEach((arr) => {
		if (!arr[0] || arr[0].type !== "separator" || arr.length === 1) return;
		final.push(arr);
	});
	final.sort(([a], [b]) => position(a, b));
	if (channels[0].length > 0) final = [channels[0], ...final];

	return final.flat();
}

export function findScrollParent(node) {
	if (node == null) return null;
	if (node.scrollHeight > node.clientHeight) return node;
	else return findScrollParent(node.parentNode);
}

import scrollIntoView from "scroll-into-view";

export function centerScroll(el, sync) {
	scrollIntoView(el, { time: sync ? 0 : 300, align: { left: 0 }, ease: (e) => e });
}

export function isChannelMuted(discordInstance, channel, guildID) {
	let settings = discordInstance.cache.user_guild_settings;
	let guild = settings.find((e) => e.guild_id === guildID);
	if (!guild) return false;
	let find = guild.channel_overrides.find((a) => a.channel_id === channel.id);
	if (find) return find.muted;
	return false;
}

export const last = (e) => e[e.length - 1];

export function decimal2rgb(ns, arr) {
	let r = Math.floor(ns / (256 * 256)),
		g = Math.floor(ns / 256) % 256,
		b = ns % 256;
	return arr ? [r, g, b] : { r, g, b };
}

export const toHTML = (text) =>
	text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

export function shuffle(array) {
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

export function inViewport(element, partial) {
	if (!(element && element instanceof Element)) return null;
	let bounding = element.getBoundingClientRect();
	let height = element.offsetHeight;
	let width = element.offsetWidth;
	return partial
		? !!(
				bounding.top >= -height &&
				bounding.left >= -width &&
				bounding.right <= window.innerWidth + width &&
				bounding.bottom <= window.innerHeight + height
		  )
		: !!(
				bounding.top >= 0 &&
				bounding.left >= 0 &&
				bounding.right <= window.innerWidth &&
				bounding.bottom <= window.innerHeight
		  );
}

export function getTopBottom(el) {
	let bounding = el.getBoundingClientRect();
	return {
		top: bounding.top,
		bottom: window.innerHeight - bounding.top - el.offsetHeight,
	};
}

export function getScrollBottom(el) {
	return el.scrollHeight - el.offsetHeight - el.scrollTop;
}

export function findUserByTag() {
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

export const dblclick = (el, bubbles = false) =>
	el.dispatchEvent(
		new MouseEvent("dblclick", {
			view: window,
			bubbles,
			cancelable: true,
		})
	);

// returns a function that waits for another function to finish before running
// also has caching abilities
export function asyncQueueGenerator(func) {
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
export function asyncCachedGenerator(func, shouldCache = true) {
	const cache = {};
	const final = async function () {
		let args = [...arguments];
		if (shouldCache) {
			const hash = hashCode(args.join(""));
			return cache[hash] || (cache[hash] = await func(...args));
		}
		return func(...args);
	};
	final.cache = cache;
	return final;
}

// calculate the outputed color if a color has opacity
// returns a color in hex
export function rgbaToHex(d = [0, 0, 0], b = [0, 0, 0], a = 1) {
	var r = Math.floor(d[0] * a + b[0] * (1 - a));
	var g = Math.floor(d[1] * a + b[1] * (1 - a));
	var b = Math.floor(d[2] * a + b[2] * (1 - a));
	return "#" + ((r << 16) | (g << 8) | b).toString(16);
}

export function delay(timeout) {
	return new Promise((res) => setTimeout(res, timeout));
}

// returns async function in which there's a limit to how many executions can be done
// if number of unfinished request exceeds limit,
// we wait for a request to finish before executing another
// also caches
export function asyncRateLimitGenerator(func, limit = 5) {
	const cache = {};
	let current = 0;

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

export const decideHeight = (e, size, minus) => {
	if (!e || typeof e !== "object") return {};
	const dataset = { "data-height": e.height, "data-width": e.width };
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
			...dataset,
		};
	} else return { height, width, ...dataset };
};

export function syncCachedGenerator(func) {
	const cache = {};
	return function () {
		let args = [...arguments];
		return cache[hashCode(args.join(""))] || (cache[hashCode(args.join(""))] = func(...args));
	};
}

import { extension as mimeExtension } from "./mime-types";

/**
 * @param {Blob|File|string} blob
 * @param {string} filename
 */
export async function downloadFile(blob, filename = null) {
	let url;
	if (typeof blob === "string") {
		const xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });
		xhr.open("GET", blob, true);
		xhr.responseType = "blob";
		xhr.send();
		const res = await new Promise((res, err) => {
			xhr.onload = () => res(xhr.response);
			xhr.onerror = err;
		});
		if (filename === null) {
			const disposition = xhr.getResponseHeader("Content-Disposition");
			if (disposition && disposition.includes("attachment")) {
				const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
				const matches = filenameRegex.exec(disposition);
				if (matches != null && matches[1]) {
					filename = matches[1].replace(/['"]/g, "");
				}
			}
		}
		blob = res;
		if (filename === null) {
			const { pathname } = new URL(xhr.responseURL);
			const lastPath = last(pathname.split("/"));
			const ext = "." + (mimeExtension(xhr.getResponseHeader("content-type")) || mimeExtension(res.type) || "bin");
			if (!lastPath.includes(".")) filename = lastPath + ext;
			else {
				filename = lastPath.endsWith(ext) ? lastPath : lastPath + ext;
			}
		}
		url = URL.createObjectURL(res);
	} else if (blob instanceof Blob) {
		url = URL.createObjectURL(blob);
	} else throw TypeError("argument 1 is not a file or a string");
	const el = document.createElement("a");
	document.body.appendChild(el);
	el.href = url;
	el.download = blob.name || filename || "unknown." + (mimeExtension(blob.type) || "bin");
	el.click();
	el.remove();
	delay(5000).then(() => URL.revokeObjectURL(url));
}

export function toDataset(obj) {
	const final = {};
	Object.entries(obj).forEach(([a, b]) => {
		final["data" + a] = b;
	});
	return final;
}

export function customDispatch(el, event) {
	el.dispatchEvent(new CustomEvent(event));
}

export function scrollToBottom(el) {
	return (el.scrollTop = el.scrollHeight);
}

export async function xhr(url, options = {}, returnXhr = false) {
	if (typeof options !== "object") options = {};
	const xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });

	xhr.open(options.method || "GET", url, true);
	xhr.responseType = options.responseType || "text";

	Object.entries(options.headers || {}).forEach(([a, b]) => {
		if (a && b) xhr.setRequestHeader(a, b.replace(/\r?\n|\r/g, "")); // nodejs http bug
	});

	xhr.send(options.body || null);

	return new Promise((res, err) => {
		xhr.onload = () => res(returnXhr ? xhr : xhr.response);
		xhr.onerror = err;
	});
}
