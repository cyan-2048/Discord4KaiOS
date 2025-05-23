import * as Comlink from "comlink";

import emoji_data from "emoji-datasource/emoji.json?url";
import type { Emojis } from "./emoji-datasource-types";

import MiniSearch from "minisearch";
import memoize from "lodash-es/memoize";
import * as rlottie from "./rlottie/worker";
import { webp } from "./libwebp/worker";

const freeze = Object.freeze;

function object<T = {}>(a: T) {
	const empty = Object.create(null);
	Object.assign(empty, a);
	return freeze(empty as T);
}

// supported skin variations
const enum SkinVariation {
	Light = "1F3FB",
	MediumLight = "1F3FC",
	Medium = "1F3FD",
	MediumDark = "1F3FE",
	Dark = "1F3FF",
}

const SUPPORTED_VARIATIONS = freeze([
	SkinVariation.Light,
	SkinVariation.MediumLight,
	SkinVariation.Medium,
	SkinVariation.MediumDark,
	SkinVariation.Dark,
]);

function fromCodePoint(codepoint: string | number) {
	var code = typeof codepoint === "string" ? parseInt(codepoint, 16) : codepoint;
	if (code < 0x10000) {
		return String.fromCharCode(code);
	}
	code -= 0x10000;
	return String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
}

export interface Emoji {
	$: string;
	name: string;
	category: EmojiCategory;
	sort_order: number;
	short_names: Readonly<Set<string>>;
	short_names_string: string;
	variation?: Readonly<Record<SkinVariation, string>>;
	tags: string;
	id: number;
}

const enum EmojiCategory {
	// these two are combined in discord
	Smileys,
	People,

	Animals,
	Food,
	Travel,
	Activities,
	Objects,
	Symbols,
	Flags,

	// not actual emojis
	Component,
}

const categories = object({
	Symbols: EmojiCategory.Symbols,
	Activities: EmojiCategory.Activities,
	Flags: EmojiCategory.Flags,
	"Travel & Places": EmojiCategory.Travel,
	"Food & Drink": EmojiCategory.Food,
	"Animals & Nature": EmojiCategory.Animals,
	"People & Body": EmojiCategory.People,
	Objects: EmojiCategory.Objects,
	Component: EmojiCategory.Component,
	"Smileys & Emotion": EmojiCategory.Smileys,
});

function unifiedString(str: string) {
	return str.split("-").map(fromCodePoint).join("");
}

const searcher = new MiniSearch<Readonly<Emoji>>({
	fields: ["tags", "short_names_string"],
});

let _emojis: Promise<Readonly<Emoji>[]> | null = null;

function initEmojis(): Promise<Readonly<Emoji>[]> {
	if (_emojis) return _emojis;
	return (_emojis = (async () => {
		const rawEmojis: Emojis = await fetch(emoji_data).then((resp) => resp.json());
		const emojis = rawEmojis.map((emoji, index) => {
			const final = {} as Emoji;

			const vars = emoji.skin_variations
				? Object.keys(emoji.skin_variations).filter((v) => SUPPORTED_VARIATIONS.includes(v as SkinVariation))
				: [];

			if (vars.length && emoji.skin_variations) {
				const variation = Object.create(null) as Record<SkinVariation, string>;
				for (const v of vars) {
					variation[v as SkinVariation] = unifiedString(emoji.skin_variations[v].unified);
				}
				final.variation = variation;
			}

			final.$ = unifiedString(emoji.unified);
			final.sort_order = emoji.sort_order;
			final.category = categories[emoji.category as keyof typeof categories];
			final.id = index;
			final.short_names = new Set((emoji.short_names as string[]) || []);
			final.short_names_string = emoji.short_names?.join(" ") || "";
			final.name = (emoji.name as string).toLowerCase();

			final.tags = [final.$, final.name].concat(emoji.short_names || []).join(" ");

			return final;
		});

		return emojis;
	})());
}

let _initSearch: Promise<Readonly<Emoji>[]> | null = null;

function initSearch(): Promise<Readonly<Emoji>[]> {
	if (_initSearch) return _initSearch;
	return (_initSearch = (async () => {
		const _emojis = await initEmojis();
		await searcher.addAllAsync(_emojis);
		return _emojis;
	})());
}

async function preloadSearch() {
	await initSearch();
}

const findByShortCode = memoize(async (shortcode: string) => {
	const emojis = await initSearch();

	return searcher
		.search(shortcode.toLowerCase(), {
			prefix: true,
			fields: ["short_names_string"],
		})
		.map((a) => emojis[a.id])
		.find((emoji) => emoji.short_names.has(shortcode));
});

const fuzzySearch = memoize(async (query: string) => {
	const emojis = await initSearch();

	return searcher
		.search(query.toLowerCase(), {
			prefix: true,
			fields: ["tags"],
		})
		.map((a) => emojis[a.id]);
});

const exposed = {
	findByShortCode,
	fuzzySearch,
	preloadSearch,
	webp,
	...rlottie,
} as const;

type Exposed = typeof exposed;

export type { Exposed };

Comlink.expose(exposed);
