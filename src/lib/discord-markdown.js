// credit: https://github.com/brussell98/discord-markdown/blob/master/index.js
/*
MIT License

Copyright (c) 2017 Brussell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import markdown from "simple-markdown";

function htmlTag(tagName, content, attributes, isClosed = true, state = {}) {
	if (typeof isClosed === "object") {
		state = isClosed;
		isClosed = true;
	}

	if (!attributes) attributes = {};

	let attributeString = "";
	for (let attr in attributes) {
		// Removes falsy attributes
		if (Object.prototype.hasOwnProperty.call(attributes, attr) && attributes[attr])
			attributeString += ` ${markdown.sanitizeText(attr)}="${markdown.sanitizeText(attributes[attr])}"`;
	}

	let unclosedTag = `<${tagName}${attributeString}>`;

	if (isClosed) return unclosedTag + content + `</${tagName}>`;
	return unclosedTag;
}
markdown.htmlTag = htmlTag;

const rules = {
	blockQuote: Object.assign({}, markdown.defaultRules.blockQuote, {
		match: function (source, state, prevSource) {
			return !/^$|\n *$/.test(prevSource) || state.inQuote
				? null
				: /^( *>>> ([\s\S]*))|^( *> [^\n]*(\n *> [^\n]*)*\n?)/.exec(source);
		},
		parse: function (capture, parse, state) {
			const all = capture[0];
			const isBlock = Boolean(/^ *>>> ?/.exec(all));
			const removeSyntaxRegex = isBlock ? /^ *>>> ?/ : /^ *> ?/gm;
			const content = all.replace(removeSyntaxRegex, "");

			return {
				content: parse(content, Object.assign({}, state, { inQuote: true })),
				type: "blockQuote",
			};
		},
	}),
	codeBlock: Object.assign({}, markdown.defaultRules.codeBlock, {
		match: markdown.inlineRegex(/^```(([a-z0-9-]+?)\n+)?\n*([^]+?)\n*```/i),
		parse: function (capture, parse, state) {
			return {
				lang: (capture[2] || "").trim(),
				content: capture[3] || "",
				inQuote: state.inQuote || false,
			};
		},
		html: (node, output, state) => {
			return htmlTag(
				"pre",
				htmlTag("code", markdown.sanitizeText(node.content), { "data-lang": node.lang }, state),
				null,
				state
			);
		},
	}),
	newline: markdown.defaultRules.newline,
	escape: markdown.defaultRules.escape,
	autolink: Object.assign({}, markdown.defaultRules.autolink, {
		parse: (capture) => {
			return {
				content: [
					{
						type: "text",
						content: capture[1],
					},
				],
				target: capture[1],
			};
		},
		html: (node, output, state) => {
			return htmlTag("a", output(node.content, state), { href: markdown.sanitizeUrl(node.target) }, state);
		},
	}),
	url: Object.assign({}, markdown.defaultRules.url, {
		parse: (capture) => {
			return {
				content: [
					{
						type: "text",
						content: capture[1],
					},
				],
				target: capture[1],
			};
		},
		html: (node, output, state) => {
			return htmlTag("a", output(node.content, state), { href: markdown.sanitizeUrl(node.target) }, state);
		},
	}),
	em: Object.assign({}, markdown.defaultRules.em, {
		parse: function (capture, parse, state) {
			const parsed = markdown.defaultRules.em.parse(capture, parse, Object.assign({}, state, { inEmphasis: true }));
			return state.inEmphasis ? parsed.content : parsed;
		},
	}),
	strong: markdown.defaultRules.strong,
	u: markdown.defaultRules.u,
	strike: Object.assign({}, markdown.defaultRules.del, {
		match: markdown.inlineRegex(/^~~([\s\S]+?)~~(?!_)/),
	}),
	inlineCode: Object.assign({}, markdown.defaultRules.inlineCode, {
		match: (source) => markdown.defaultRules.inlineCode.match.regex.exec(source),
		html: function (node, output, state) {
			return htmlTag("code", markdown.sanitizeText(node.content.trim()), null, state);
		},
	}),
	text: Object.assign({}, markdown.defaultRules.text, {
		match: (source) => /^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff-]|\n\n|\n|\w+:\S|$)/.exec(source),
		html: function (node, output, state) {
			if (state.escapeHTML) return markdown.sanitizeText(node.content);

			return node.content;
		},
	}),
	emoticon: {
		order: markdown.defaultRules.text.order,
		match: (source) => /^(¯\\_\(ツ\)_\/¯)/.exec(source),
		parse: function (capture) {
			return {
				type: "text",
				content: capture[1],
			};
		},
		html: function (node, output, state) {
			return output(node.content, state);
		},
	},
	br: Object.assign({}, markdown.defaultRules.br, {
		match: markdown.anyScopeRegex(/^\n/),
	}),
	spoiler: {
		order: 0,
		match: (source) => /^\|\|([\s\S]+?)\|\|/.exec(source),
		parse: function (capture, parse, state) {
			return {
				content: parse(capture[1], state),
			};
		},
		html: function (node, output, state) {
			return htmlTag("span", output(node.content, state), { class: "spoiler" }, state);
		},
	},
};

const discordCallbackDefaults = {
	user: (node) => "loading...",
	channel: (node) => "loading...",
	role: (node) => "loading...",
	everyone: () => "@everyone",
	here: () => "@here",
};

const rulesDiscord = {
	discordUser: {
		order: markdown.defaultRules.strong.order,
		match: (source) => /^<@!?([0-9]*)>/.exec(source),
		parse: function (capture) {
			return {
				id: capture[1],
			};
		},
		html: function (node, output, state) {
			return htmlTag(
				"span",
				state.discordCallback.user(node),
				{ class: "mentions", "data-id": node.id, "data-type": "user" },
				state
			);
		},
	},
	discordChannel: {
		order: markdown.defaultRules.strong.order,
		match: (source) => /^<#?([0-9]*)>/.exec(source),
		parse: function (capture) {
			return {
				id: capture[1],
			};
		},
		html: function (node, output, state) {
			return htmlTag(
				"span",
				state.discordCallback.channel(node),
				{ class: "mentions", "data-id": node.id, "data-type": "channel" },
				state
			);
		},
	},
	discordRole: {
		order: markdown.defaultRules.strong.order,
		match: (source) => /^<@&([0-9]*)>/.exec(source),
		parse: function (capture) {
			return {
				id: capture[1],
			};
		},
		html: function (node, output, state) {
			return htmlTag(
				"span",
				state.discordCallback.role(node),
				{ class: "mentions", "data-id": node.id, "data-type": "role" },
				state
			);
		},
	},
	discordEmoji: {
		order: markdown.defaultRules.strong.order,
		match: (source) => /^<(a?):(\w+):(\d+)>/.exec(source),
		parse: function (capture) {
			return {
				animated: capture[1] === "a",
				name: capture[2],
				id: capture[3],
			};
		},
		html: function (node, output, state) {
			return htmlTag(
				"div",
				"",
				{
					class: "emoji",
					style: `--emoji_url: url('https://cdn.discordapp.com/emojis/${node.id}.${
						node.animated ? "gif" : "png"
					}?size=32');`,
				},
				true,
				state
			);
		},
	},
	discordEveryone: {
		order: markdown.defaultRules.strong.order,
		match: (source) => /^@everyone/.exec(source),
		parse: function () {
			return {};
		},
		html: function (node, output, state) {
			return htmlTag("span", state.discordCallback.everyone(node), { class: "mentions" }, state);
		},
	},
	discordHere: {
		order: markdown.defaultRules.strong.order,
		match: (source) => /^@here/.exec(source),
		parse: function () {
			return {};
		},
		html: function (node, output, state) {
			return htmlTag("span", state.discordCallback.here(node), { class: "mentions" }, state);
		},
	},
};

Object.assign(rules, rulesDiscord);

const rulesDiscordOnly = Object.assign({}, rulesDiscord, {
	text: Object.assign({}, markdown.defaultRules.text, {
		match: (source) => /^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff-]|\n\n|\n|\w+:\S|$)/.exec(source),
		html: function (node, output, state) {
			if (state.escapeHTML) return markdown.sanitizeText(node.content);

			return node.content;
		},
	}),
});

const rulesEmbed = Object.assign({}, rules, {
	link: markdown.defaultRules.link,
});

const parser = markdown.parserFor(rules);
const htmlOutput = markdown.outputFor(rules, "html");
const parserDiscord = markdown.parserFor(rulesDiscordOnly);
const htmlOutputDiscord = markdown.outputFor(rulesDiscordOnly, "html");
const parserEmbed = markdown.parserFor(rulesEmbed);
const htmlOutputEmbed = markdown.outputFor(rulesEmbed, "html");

/**
 * Parse markdown and return the HTML output
 * @param {String} source Source markdown content
 * @param {Object} [options] Options for the parser
 * @param {Boolean} [options.embed=false] Parse as embed content
 * @param {Boolean} [options.escapeHTML=true] Escape HTML in the output
 * @param {Boolean} [options.discordOnly=false] Only parse Discord-specific stuff (such as mentions)
 * @param {Object} [options.discordCallback] Provide custom handling for mentions and emojis
 */
function toHTML(source, options, customParser, customHtmlOutput) {
	if ((customParser || customHtmlOutput) && (!customParser || !customHtmlOutput))
		throw new Error("You must pass both a custom parser and custom htmlOutput function, not just one");

	options = Object.assign(
		{
			embed: false,
			escapeHTML: true,
			discordOnly: false,
			discordCallback: {},
		},
		options || {}
	);

	let _parser = parser;
	let _htmlOutput = htmlOutput;
	if (customParser) {
		_parser = customParser;
		_htmlOutput = customHtmlOutput;
	} else if (options.discordOnly) {
		_parser = parserDiscord;
		_htmlOutput = htmlOutputDiscord;
	} else if (options.embed) {
		_parser = parserEmbed;
		_htmlOutput = htmlOutputEmbed;
	}

	const state = {
		inline: true,
		inQuote: false,
		inEmphasis: false,
		escapeHTML: options.escapeHTML,
		discordCallback: Object.assign({}, discordCallbackDefaults, options.discordCallback),
	};

	return _htmlOutput(_parser(source, state), state);
}

const toExport = {
	parser: (source) => parser(source, { inline: true }),
	htmlOutput,
	toHTML,
	rules,
	rulesDiscordOnly,
	rulesEmbed,
	markdownEngine: markdown,
	htmlTag,
};

export default toExport;
