import { groups } from "emojibase-data/en/messages.json";
import emoji_map from "../assets/emojis.json";

const emojis = new Map(emoji_map);

import levenshtein from "js-levenshtein";

function textMatches(text, val) {
	console.log(text, val);
	return levenshtein(text, val) < 3;
}

const { isArray } = Array;

function arrayMatches(text, array) {
	for (let i = 0; i < array.length; i++) {
		const val = array[i];
		if (textMatches(text, val)) return true;
	}
	return false;
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
	query(emoji, limit = 5) {
		const results = [];
		for (const [unicode, { shortcode }] of emojis.entries()) {
			if (limit === results.length) break;
			const found = (isArray(shortcode) && arrayMatches(emoji, shortcode)) || textMatches(emoji, shortcode);
			if (found) results.push(unicode);
		}
		return results;
	},

	/** find emoji unicode using shortcode */
	fromShortcode(query) {
		let bestMatch = null;

		for (const [unicode, { shortcode }] of emojis.entries()) {
			const found = (isArray(shortcode) && shortcode.includes(query)) || shortcode === query;
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
