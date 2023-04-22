import "./main";

import * as utils from "@utils";
import * as shared from "@shared";
import markdown from "@lib/discord-markdown";
import Discord, { get } from "discord/main";
import * as React from "preact/compat";
import { html } from "htm/preact";
import { CHAR_REGEX, EMOJI_REGEX } from "@components/Markdown";
Object.assign(window, utils, { get, shared, utils, Discord, markdown, React, h: html, CHAR_REGEX, EMOJI_REGEX }, shared);

function softkey(e) {
	const { target, key, bubbles, cancelable, repeat, type } = e;
	if (!/Left|Right/.test(key) || !key.startsWith("Arrow") || !e.ctrlKey) return;
	e.stopImmediatePropagation();
	e.stopPropagation();
	e.preventDefault();
	target.dispatchEvent(new KeyboardEvent(type, { key: "Soft" + key.slice(5), bubbles, cancelable, repeat }));
}

document.addEventListener("keyup", softkey, true);
document.addEventListener("keydown", softkey, true);
/*
// code to test re-renders
const createEl = document.createElement.bind(document);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function blinkElement(el) {
	await sleep(10);
	if (el.tagName == "CANVAS" || el.id.includes("preact")) return;
	const def = el.style.backgroundColor;

	el.style.backgroundColor = "red";
	await sleep(1000);
	el.style.backgroundColor = def;
}

document.createElement = (...args) => {
	const created = createEl(...args);
	// console.warn(...args);
	blinkElement(created);
	return created;
};

*/
