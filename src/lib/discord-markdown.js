var CR_NEWLINE_R = /\r\n?/g;
var TAB_R = /\t/g;
var FORMFEED_R = /\f/g;

// recognize a `*` `-`, `+`, `1.`, `2.`... list bullet
var LIST_BULLET = "(?:[*-]|\\d+\\.)";
// recognize the start of a list item:
// leading space plus a bullet plus a space (`   * `)
var LIST_ITEM_PREFIX = "( *)(" + LIST_BULLET + ") +";
var LIST_ITEM_PREFIX_R = new RegExp("^" + LIST_ITEM_PREFIX);
// recognize an individual list item:
//  * hi
//    this is part of the same item
//
//    as is this, which is a new paragraph in the same item
//
//  * but this is not part of the same item
var LIST_ITEM_R = new RegExp(LIST_ITEM_PREFIX + "[^\\n]*(?:\\n" + "(?!\\1" + LIST_BULLET + " )[^\\n]*)*(\n|$)", "gm");
var BLOCK_END_R = /\n{2,}$/;
var INLINE_CODE_ESCAPE_BACKTICKS_R = /^ (?= *`)|(` *) $/g;
// recognize the end of a paragraph block inside a list item:
// two or more newlines at end end of the item
var LIST_BLOCK_END_R = BLOCK_END_R;
var LIST_ITEM_END_R = / *\n+$/;
// check whether a list item has paragraphs: if it does,
// we leave the newlines at the end
var LIST_R = new RegExp(
	"^( *)(" +
		LIST_BULLET +
		") " +
		"[\\s\\S]+?(?:\n{2,}(?! )" +
		"(?!\\1" +
		LIST_BULLET +
		" )\\n*" +
		// the \\s*$ here is so that we can parse the inside of nested
		// lists, where our content might end before we receive two `\n`s
		"|\\s*\n*$)"
);
var LIST_LOOKBEHIND_R = /(?:^|\n)( *)$/;

function preprocess(source) {
	return source.replace(CR_NEWLINE_R, "\n").replace(FORMFEED_R, "").replace(TAB_R, "    ");
}

function populateInitialState(givenState, defaultState) {
	var state = givenState || {};
	if (defaultState != null) {
		for (var prop in defaultState) {
			if (Object.prototype.hasOwnProperty.call(defaultState, prop)) {
				state[prop] = defaultState[prop];
			}
		}
	}
	return state;
}

function parserFor(rules, defaultState) {
	var ruleList = Object.keys(rules).filter(function (type) {
		var rule = rules[type];
		if (rule == null || rule.match == null) {
			return false;
		}
		var order = rule.order;
		if ((typeof order !== "number" || !isFinite(order)) && typeof console !== "undefined") {
			console.warn("simple-markdown: Invalid order for rule `" + type + "`: " + String(order));
		}
		return true;
	});

	ruleList.sort(function (typeA, typeB) {
		var ruleA = rules[typeA];
		var ruleB = rules[typeB];
		var orderA = ruleA.order;
		var orderB = ruleB.order;

		if (orderA !== orderB) {
			return orderA - orderB;
		}

		var secondaryOrderA = ruleA.quality ? 0 : 1;
		var secondaryOrderB = ruleB.quality ? 0 : 1;

		if (secondaryOrderA !== secondaryOrderB) {
			return secondaryOrderA - secondaryOrderB;
		} else if (typeA < typeB) {
			return -1;
		} else if (typeA > typeB) {
			return 1;
		} else {
			return 0;
		}
	});

	var latestState;
	var nestedParse = function (source, state) {
		var result = [];
		state = state || latestState;
		latestState = state;
		while (source) {
			var ruleType = null;
			var rule = null;
			var capture = null;
			var quality = NaN;

			var i = 0;
			var currRuleType = ruleList[0];
			var currRule = rules[currRuleType];

			do {
				var currOrder = currRule.order;
				var prevCaptureStr = state.prevCapture == null ? "" : state.prevCapture[0];
				var currCapture = currRule.match(source, state, prevCaptureStr);

				if (currCapture) {
					var currQuality = currRule.quality ? currRule.quality(currCapture, state, prevCaptureStr) : 0;

					if (!(currQuality <= quality)) {
						ruleType = currRuleType;
						rule = currRule;
						capture = currCapture;
						quality = currQuality;
					}
				}

				i++;
				currRuleType = ruleList[i];
				currRule = rules[currRuleType];
			} while (currRule && (!capture || (currRule.order === currOrder && currRule.quality)));

			if (rule == null || capture == null) {
				throw new Error(
					"Could not find a matching rule for the below " +
						"content. The rule with highest `order` should " +
						"always match content provided to it. Check " +
						"the definition of `match` for '" +
						ruleList[ruleList.length - 1] +
						"'. It seems to not match the following source:\n" +
						source
				);
			}
			if (capture.index) {
				throw new Error("`match` must return a capture starting at index 0 " + "(the current parse index). Did you forget a ^ at the " + "start of the RegExp?");
			}

			var parsed = rule.parse(capture, nestedParse, state);

			if (Array.isArray(parsed)) {
				Array.prototype.push.apply(result, parsed);
			} else {
				if (parsed.type == null) {
					parsed.type = ruleType;
				}
				result.push(parsed);
			}

			state.prevCapture = capture;
			source = source.substring(state.prevCapture[0].length);
		}
		return result;
	};

	var outerParse = function (source, state) {
		latestState = populateInitialState(state, defaultState);
		if (!latestState.inline && !latestState.disableAutoBlockNewlines) {
			source = source + "\n\n";
		}

		latestState.prevCapture = null;
		return nestedParse(preprocess(source), latestState);
	};
	return outerParse;
}

function inlineRegex(regex) {
	var match = function (source, state) {
		if (state.inline) {
			return regex.exec(source);
		} else {
			return null;
		}
	};
	match.regex = regex;
	return match;
}

function blockRegex(regex) {
	var match = function (source, state) {
		if (state.inline) {
			return null;
		} else {
			return regex.exec(source);
		}
	};
	match.regex = regex;
	return match;
}

function anyScopeRegex(regex) {
	var match = function (source, state) {
		return regex.exec(source);
	};
	match.regex = regex;
	return match;
}

var EMPTY_PROPS = {};

function sanitizeUrl(url) {
	if (url == null) {
		return null;
	}
	try {
		var prot = decodeURIComponent(url)
			.replace(/[^A-Za-z0-9/:]/g, "")
			.toLowerCase();
		if (prot.indexOf("javascript:") === 0 || prot.indexOf("vbscript:") === 0 || prot.indexOf("data:") === 0) {
			return null;
		}
	} catch (e) {
		return null;
	}
	return url;
}

/*
// unused for now
var SANITIZE_TEXT_R = /[<>&"']/g;

var SANITIZE_TEXT_CODES = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	'"': "&quot;",
	"'": "&#x27;",
	"/": "&#x2F;",
	"`": "&#96;",
};

function sanitizeText(text) {
	return String(text).replace(SANITIZE_TEXT_R, function (chr) {
		return SANITIZE_TEXT_CODES[chr];
	});
};
*/

var UNESCAPE_URL_R = /\\([^0-9A-Za-z\s])/g;

var unescapeUrl = function (rawUrlString) {
	return rawUrlString.replace(UNESCAPE_URL_R, "$1");
};

function parseInline(parse, content, state) {
	var isCurrentlyInline = state.inline || false;
	state.inline = true;
	var result = parse(content, state);
	state.inline = isCurrentlyInline;
	return result;
}
function parseBlock(parse, content, state) {
	var isCurrentlyInline = state.inline || false;
	state.inline = false;
	var result = parse(content + "\n\n", state);
	state.inline = isCurrentlyInline;
	return result;
}

function parseCaptureInline(capture, parse, state) {
	return {
		content: parseInline(parse, capture[1], state),
	};
}
function ignoreCapture() {
	return EMPTY_PROPS;
}

var INLINE_CODE_ESCAPE_BACKTICKS_R = /^ (?= *`)|(` *) $/g;

var LINK_INSIDE = "(?:\\[[^\\]]*\\]|[^\\[\\]]|\\](?=[^\\[]*\\]))*";
var LINK_HREF_AND_TITLE = "\\s*<?((?:\\([^)]*\\)|[^\\s\\\\]|\\\\.)*?)>?(?:\\s+['\"]([\\s\\S]*?)['\"])?\\s*";

let currOrder = 0;

const rules = {
	codeBlock: {
		order: currOrder++,
		match: inlineRegex(/^```(([a-z0-9-]+?)\n+)?\n*([^]+?)\n*```/i),
		parse: function (capture, parse, state) {
			return {
				lang: (capture[2] || "").trim(),
				content: capture[3] || "",
				inQuote: state.inQuote || false,
			};
		},
	},
	blockquote: {
		order: currOrder++,
		match: function (source, state, prevSource) {
			return !/^$|\n *$/.test(prevSource) || state.inQuote ? null : /^( *>>> ([\s\S]*))|^( *> [^\n]*(\n *> [^\n]*)*\n?)/.exec(source);
		},
		parse: function (capture, parse, state) {
			const all = capture[0];
			const isBlock = Boolean(/^ *>>> ?/.exec(all));
			const removeSyntaxRegex = isBlock ? /^ *>>> ?/ : /^ *> ?/gm;
			const content = all.replace(removeSyntaxRegex, "");

			return {
				content: parse(content, { ...state, inQuote: true }),
			};
		},
	},

	list: {
		order: currOrder++,
		match: function (source, state) {
			// We only want to break into a list if we are at the start of a
			// line. This is to avoid parsing "hi * there" with "* there"
			// becoming a part of a list.
			// You might wonder, "but that's inline, so of course it wouldn't
			// start a list?". You would be correct! Except that some of our
			// lists can be inline, because they might be inside another list,
			// in which case we can parse with inline scope, but need to allow
			// nested lists inside this inline scope.
			var prevCaptureStr = state.prevCapture == null ? "" : state.prevCapture[0];
			var isStartOfLineCapture = LIST_LOOKBEHIND_R.exec(prevCaptureStr);

			if (isStartOfLineCapture) {
				source = isStartOfLineCapture[1] + source;
				return LIST_R.exec(source);
			} else {
				return null;
			}
		},
		parse: function (capture, parse, state) {
			var bullet = capture[2];
			var ordered = bullet.length > 1;
			var start = ordered ? +bullet : undefined;
			var items = /** @type {string[]} */ (capture[0].replace(LIST_BLOCK_END_R, "\n").match(LIST_ITEM_R));

			// We know this will match here, because of how the regexes are
			// defined
			/*:: items = ((items : any) : Array<string>) */

			var lastItemWasAParagraph = false;
			var itemContent = items.map(function (/** @type {string} */ item, /** @type {number} */ i) {
				// We need to see how far indented this item is:
				var prefixCapture = LIST_ITEM_PREFIX_R.exec(item);
				var space = prefixCapture ? prefixCapture[0].length : 0;
				// And then we construct a regex to "unindent" the subsequent
				// lines of the items by that amount:
				var spaceRegex = new RegExp("^ {1," + space + "}", "gm");

				// Before processing the item, we need a couple things
				var content = item
					// remove indents on trailing lines:
					.replace(spaceRegex, "")
					// remove the bullet:
					.replace(LIST_ITEM_PREFIX_R, "");

				// I'm not sur4 why this is necessary again?
				/*:: items = ((items : any) : Array<string>) */

				// Handling "loose" lists, like:
				//
				//  * this is wrapped in a paragraph
				//
				//  * as is this
				//
				//  * as is this
				var isLastItem = i === items.length - 1;
				var containsBlocks = content.indexOf("\n\n") !== -1;

				// Any element in a list is a block if it contains multiple
				// newlines. The last element in the list can also be a block
				// if the previous item in the list was a block (this is
				// because non-last items in the list can end with \n\n, but
				// the last item can't, so we just "inherit" this property
				// from our previous element).
				var thisItemIsAParagraph = containsBlocks || (isLastItem && lastItemWasAParagraph);
				lastItemWasAParagraph = thisItemIsAParagraph;

				// backup our state for restoration afterwards. We're going to
				// want to set state._list to true, and state.inline depending
				// on our list's looseness.
				var oldStateInline = state.inline;
				var oldStateList = state._list;
				state._list = true;

				// Parse inline if we're in a tight list, or block if we're in
				// a loose list.
				var adjustedContent;
				if (thisItemIsAParagraph) {
					state.inline = false;
					adjustedContent = content.replace(LIST_ITEM_END_R, "\n\n");
				} else {
					state.inline = true;
					adjustedContent = content.replace(LIST_ITEM_END_R, "");
				}

				var result = parse(adjustedContent, state);

				// Restore our state before returning
				state.inline = oldStateInline;
				state._list = oldStateList;
				return result;
			});

			return {
				ordered: ordered,
				start: start,
				items: itemContent,
			};
		},
	},

	heading: {
		order: currOrder++,
		match(source, state) {
			var prevCaptureStr = state.prevCapture == null ? "" : state.prevCapture[0];
			var isStartOfLineCapture = /(?:^|\n)( *)$/.exec(prevCaptureStr);

			if (isStartOfLineCapture) {
				source = isStartOfLineCapture[1] + source;
				// console.log(source);
				return /^(#{1,3})\s+([^\n]+)/.exec(source);
			} else {
				return null;
			}
		},
		parse: function (capture, parse, state) {
			return {
				level: capture[1].length,
				content: parseInline(parse, capture[2].trim(), state),
			};
		},
	},

	escape: {
		order: currOrder++,

		match: inlineRegex(/^\\([^0-9A-Za-z\s])/),
		parse(capture, parse, state) {
			return {
				type: "text",
				content: capture[1],
			};
		},
	},
	autolink: {
		order: currOrder++,
		match: inlineRegex(/^<([^: >]+:\/[^ >]+)>/),
		parse(capture, parse, state) {
			return {
				type: "link",
				content: [
					{
						type: "text",
						content: capture[1],
					},
				],
				target: capture[1],
			};
		},
	},
	url: {
		order: 0,
		match: inlineRegex(/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/),
		parse(capture, parse, state) {
			return {
				type: "link",
				content: [
					{
						type: "text",
						content: capture[1],
					},
				],
				target: capture[1],
			};
		},
	},
	link: {
		order: currOrder++,
		match: inlineRegex(new RegExp("^\\[(" + LINK_INSIDE + ")\\]\\(" + LINK_HREF_AND_TITLE + "\\)")),
		parse(capture, parse, state) {
			var link = {
				content: parse(capture[1], state),
				target: unescapeUrl(capture[2]),
				title: capture[3],
			};
			return link;
		},
	},
	em: {
		order: currOrder,
		match: inlineRegex(/^\b_((?:__|\\[\s\S]|[^\\_])+?)_\b|^\*(?=\S)((?:\*\*|\\[\s\S]|\s+(?:\\[\s\S]|[^\s\*\\]|\*\*)|[^\s\*\\])+?)\*(?!\*)/),
		quality(capture) {
			return capture[0].length + 0.2;
		},
		parse(capture, parse, state) {
			return {
				content: parse(capture[2] || capture[1], state),
			};
		},
	},
	strong: {
		order: currOrder,
		match: inlineRegex(/^\*\*((?:\\[\s\S]|[^\\])+?)\*\*(?!\*)/),
		quality(capture) {
			return capture[0].length + 0.1;
		},
		parse: parseCaptureInline,
	},
	u: {
		order: currOrder++,
		match: inlineRegex(/^__((?:\\[\s\S]|[^\\])+?)__(?!_)/),
		quality(capture) {
			return capture[0].length;
		},
		parse: parseCaptureInline,
	},
	del: {
		order: currOrder++,
		match: inlineRegex(/^~~([\s\S]+?)~~(?!_)/),
		parse: parseCaptureInline,
	},
	code: {
		order: currOrder++,
		match: inlineRegex(/^(`+)([\s\S]*?[^`])\1(?!`)/),
		parse(capture, parse, state) {
			return {
				content: [
					{
						type: "text",
						content: capture[2].replace(INLINE_CODE_ESCAPE_BACKTICKS_R, "$1"),
					},
				],
			};
		},
	},
	text: {
		order: currOrder++,
		match: anyScopeRegex(/^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff]|\n\n| {2,}\n|\w+:\S|$)/),
		parse(capture, parse, state) {
			return {
				type: "text",
				content: capture[0],
			};
		},
	},
	emoticon: {
		order: currOrder,
		match: (source) => /^(¯\\_\(ツ\)_\/¯)/.exec(source),
		parse(capture) {
			return {
				type: "text",
				content: capture[1],
			};
		},
		html(node, output, state) {
			return output(node.content, state);
		},
	},
	spoiler: {
		order: 0,
		match: (source) => /^\|\|([\s\S]+?)\|\|/.exec(source),
		parse: function (capture, parse, state) {
			return {
				type: "spoiler",
				content: parse(capture[1], state),
			};
		},
	},
};

const ruleStrong = rules.strong.order;

const rulesDiscord = {
	"@user": {
		order: ruleStrong,
		match: (source) => /^<@!?([0-9]*)>/.exec(source),
		parse(capture) {
			return {
				id: capture[1],
			};
		},
	},
	"#channel": {
		order: ruleStrong,
		match: (source) => /^<#?([0-9]*)>/.exec(source),
		parse(capture) {
			return {
				type: "#channel",
				id: capture[1],
			};
		},
	},
	"@role": {
		order: ruleStrong,
		match: (source) => /^<@&([0-9]*)>/.exec(source),
		parse(capture) {
			return {
				id: capture[1],
			};
		},
	},
	":emoji:": {
		order: ruleStrong,
		match: (source) => /^<(a?):(\w+):(\d+)>/.exec(source),
		parse(capture) {
			return {
				animated: capture[1] === "a",
				name: capture[2],
				id: capture[3],
			};
		},
	},
	// ":shortcode:": {
	// 	order: ruleStrong,
	// 	match: (source) => /^:(\w+):/.exec(source),
	// 	parse(capture) {
	// 		return {
	// 			type: "text",
	// 			content: EmojiDict.fromShortcode(capture[1]) || capture[0],
	// 		};
	// 	},
	// },
	"@everyone": {
		order: ruleStrong,
		match: (source) => /^@everyone/.exec(source),
		parse: ignoreCapture,
	},
	"@here": {
		order: ruleStrong,
		match: (source) => /^@here/.exec(source),
		parse: ignoreCapture,
	},
};

Object.assign(rules, rulesDiscord);

const rulesDiscordOnly = { ...rulesDiscord, text: rules.text };

const { link: ruleLink, ..._rules } = rules;

// idk if this is even useful???
const rulesEmbed = { ..._rules, link: rules.link };

const defaultParse = parserFor(_rules);
const discordOnly = parserFor(rulesDiscordOnly);
const embedParse = parserFor(rulesEmbed);

export default function parse(source, options, state = { inline: true, inQuote: false }) {
	const func = options.discordOnly ? discordOnly : options.embed ? embedParse : defaultParse;
	return func(source, state);
}
