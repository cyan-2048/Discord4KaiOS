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

export { hashCode, bitwise2text, groupBy, parseRoleAccess, wouldMessagePing, wouldMessagePingDM };
