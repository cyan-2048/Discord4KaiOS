#!/usr/bin/env node

const shortcodes = require("emojibase-data/en/shortcodes/joypixels.json");
const compact_emojis = require("emojibase-data/en/compact.json");
const fs = require("fs");

const emojis = new Map(
	compact_emojis.map(({ hexcode, unicode, ...a }) => {
		let shortcode = shortcodes[hexcode];
		a.skins?.forEach((a) => delete a.hexcode);
		return [unicode, { ...a, shortcode, group: "group" in a ? a.group : 8 }];
	})
);

fs.writeFileSync("./assets/emojis.json", JSON.stringify([...emojis], null, "\t"));
