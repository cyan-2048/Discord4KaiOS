import { groups } from "emojibase-data/en/messages.json";
import emoji_map from "../assets/emojis.json";

const emojis = new Map(emoji_map);

import { compareTwoStrings } from "./helper.js";

function getScore(text, val) {
	return compareTwoStrings(String(text), String(val));
}

function getScoreArray(text, array) {
	let res = Infinity;
	for (let i = 0; i < array.length; i++) {
		if (!res) break;
		const val = array[i];
		const score = getScore(text, val);
		res = Math.min(res, score);
	}
	return res;
}

const EmojiDict = {
	groups,
	emojis,
	/**
	 * find strict matching unicode
	 */
	search(param, emoji = false) {
		const _1 = emojis.get(param);
		const _2 = emojis.get(param + "️");
		return emoji ? _1 || _2 : _1 ? param : _2;
	},
	/**
	 * find emoji with closest match
	 */
	query(text, limit = 5) {},

	/** find emoji unicode using shortcode */
	fromShortcode(query) {
		let bestMatch = null;

		for (const [unicode, { shortcode }] of emojis.entries()) {
			const found = (Array.isArray(shortcode) && shortcode.includes(query)) || shortcode === query;
			if (found) {
				bestMatch = unicode;
				break;
			}
		}

		return bestMatch;
	},

	/**
	 * get emojis by group
	 */
	getEmojisByGroup(param) {
		let group = null;
		if (typeof param === "number" && param > -1 && param < groups.length) {
			group = param;
		} else {
			const string = String(param);
			group = groups.find((a) => a.key.includes(string) || a.message.includes(string))?.order;
		}
		if (typeof group === "undefined") return null;
		return [...emojis.values()]
			.filter((a) => a.group === group)
			.sort((a, b) => {
				const isUndefined = (o) => typeof o.order === "undefined";
				return isUndefined(a) - isUndefined(b) || a.order - b.order;
			});
	},
};

export default EmojiDict;
