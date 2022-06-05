import shortcodes from "emojibase-data/en/shortcodes/joypixels.json";
import { groups } from "emojibase-data/en/messages.json";
import compact_emojis from "emojibase-data/en/compact.json";
const emojis = compact_emojis.map((a) => {
	let shortcode = shortcodes[a.hexcode];
	return { ...a, shortcode, group: "group" in a ? a.group : 8 };
});
const cached = {};
const EmojiDict = {
	groups,
	emojis,
	cached,
	/**
	 * find strict matching unicode
	 */
	search(param) {
		const string = String(param);
		if (cached[string]) return cached[string];
		let found = emojis.find((a) => a.unicode === string || (a.shortcode instanceof Array && a.shortcode.includes(string)) || a.shortcode === string)?.unicode;
		cached[string] = found;
		return found;
	},
	/**
	 * find emoji with closest match
	 */
	query() {},
	/**
	 * get emojis by group
	 */
	getEmojisByGroup(param) {
		let group = null;
		if (typeof param === "number" && param > -1 && param < groups.length) {
			group = param;
		} else {
			let string = String(param);
			group = groups.find((a) => a.key.includes(string) || a.message.includes(string))?.order;
		}
		if (typeof group === "undefined") return null;
		return emojis
			.filter((a) => a.group === group)
			.sort((a, b) => {
				let isUndefined = (o) => typeof o.order === "undefined";
				return isUndefined(a) - isUndefined(b) || a.order - b.order;
			});
	},
};

window.EmojiDict = EmojiDict;

export default EmojiDict;
