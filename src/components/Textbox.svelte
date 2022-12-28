<script>
	import { discord, isServerOwner } from "../lib/database";

	import { back, compareTwoStrings, delay, last, scrollToBottom, siftChannels } from "../lib/helper";
	import { serverProfiles, settings, sn } from "../lib/shared";
	import { messages } from "../routes/stores";
	import TextboxQuery from "./TextboxQuery.svelte";

	export let focused = false,
		value = "",
		chatbox,
		editing,
		replying,
		showHeader,
		channelID,
		guildID,
		picker,
		channel,
		roles;

	const files = picker.files;

	let textarea, after, textboxEl, textboxHeight;

	let query = null,
		queryTitle = 0,
		queryText = "";

	export async function focus() {
		await delay(50);
		textarea.focus();
	}

	export function getCaret() {
		return textarea.selectionStart;
	}

	export function setCaret(index) {
		textarea.selectionStart = index;
		textarea.selectionEnd = index;
	}

	/**
	 * @param text text to replace
	 * @param start index where to start replacing
	 * @param end steps where replacing ends
	 */
	export function insertMention(text = "", start, end) {
		const a = value.slice(0, start);
		const b = value.slice(start + end);

		textarea.value = value = a + text + b;
		updateHeight();
		setCaret(start + text.length);
	}

	export function updateHeight() {
		value = after.innerText = textarea.value;
		textarea.style.height = after.offsetHeight + "px";
		scrollToBottom(textarea);
		textboxHeight = textboxEl.offsetHeight + 27 + "px";
	}

	export function replaceText(text) {
		textarea.value = text;
		updateHeight();
	}

	function sed(sedString) {
		try {
			if (!sedString) return null;

			const _userID = discord.user.id;

			const lastMessage = $messages.findLast((a) => a?.author?.id === _userID);
			if (!lastMessage || !lastMessage.content) return null;

			let regex = "";
			let string = "";
			let toSplit = sedString.slice(2);
			if (toSplit.split("/").length === 2) {
				let a;
				[a, string] = toSplit.split("/");
				regex = new RegExp(a);
			} else {
				const escaped = [...toSplit.matchAll(/\\\//g)].map((a) => a.index + 1);
				const matches = [...toSplit.matchAll(/\//g)].map((a) => a.index);
				const exact = matches.filter((a) => !escaped.includes(a));
				const index = exact[0];
				regex = new RegExp(toSplit.slice(0, index));
				string = toSplit.slice(index + 1);
			}

			const original = lastMessage.content;
			const modified = original.replace(regex, string);
			if (modified !== original) return { id: lastMessage.id, modified };
		} catch (e) {
			return null;
		}
	}

	let isTyping = false;

	let textboxQuery;
</script>

{#if query}
	<TextboxQuery {queryText} {roles} {guildID} bind:this={textboxQuery} {query} title={queryTitle} bottom={textboxHeight} />
{/if}
<div bind:this={textboxEl} class="textbox">
	<textarea
		on:input={async function () {
			if (!isTyping) {
				isTyping = true;
				discord.xhrRequestJSON("POST", `channels/${channelID}/typing`);
				setTimeout(() => (isTyping = false), 8000);
			}

			updateHeight();

			const currentIndex = getCaret();

			function queryFind(prefix) {
				if (value.includes(prefix)) {
					const sliced = value.slice(0, currentIndex);
					if (sliced.includes(prefix)) {
						const found = last(sliced.split(prefix));
						if (found && !/\s/.test(found)) return prefix + found;
					}
				}
				return null;
			}

			function queryEmoji() {
				const found = queryFind(":");
				const sliced = value.slice(0, currentIndex);
				const previous = sliced[sliced.lastIndexOf(":") - 1];
				if (found && (/\s/.test(previous) || !previous)) {
					return found;
				}
				return null;
			}

			queryText = (guildID != "@me" && queryFind("#")) || queryFind("@") || queryEmoji();
			const _title = queryText ? ["@", "#", ":"].indexOf(queryText[0]) : null;

			function compareToQuery(string) {
				if (!string) return false;
				return compareTwoStrings(String(string).toLowerCase(), queryText.slice(1).toLowerCase()) > 0.3;
			}

			if (queryText) {
				const _found = [];
				if (_title === 0) {
					if (guildID == "@me") {
						for (let i = 0; i < channel.recipients.length; i++) {
							const val = channel.recipients[i];
							if (_found.length >= 5) break;
							if (compareToQuery(val.username)) _found.push(val);
						}

						if (_found.length < 5 && compareToQuery(discord.user.username)) _found.push(discord.user);
					} else {
						for (const [key, val] of $serverProfiles) {
							if (!key.startsWith(guildID)) continue;
							if (_found.length >= 5) break;
							if (compareToQuery(val.nick) || compareToQuery(val.user.username)) {
								_found.push(val);
							}
						}
					}
				}
				if (_title === 1) {
					const raw = await discord.getChannels(guildID);
					const serverProfile = $serverProfiles.get(guildID + "/" + discord.user.id) || (await discord.getServerProfile(guildID, discord.user.id));
					const sifted = siftChannels(raw, roles, serverProfile, await isServerOwner(guildID), true);

					for (let i = 0; i < sifted.length; i++) {
						const val = sifted[i];
						if (_found.length >= 5) break;
						if (compareToQuery(val.name)) _found.push(val);
					}
				}
				if (_title === 2) {
				}
				if (_found.length) query = _found;
				else query = null;
			} else query = null;

			if (query) {
				$settings.devmode && console.error("query:", query);
				queryTitle = _title;
			}
		}}
		bind:this={textarea}
		on:focus={() => {
			showHeader = true;
			focused = true;
		}}
		on:blur={() => (focused = false)}
		rows="1"
		on:keydown={async function (e) {
			const { key } = e;
			const val = textarea.value;

			function stop() {
				e.stopImmediatePropagation();
				e.stopPropagation();
			}

			if (key === "ArrowUp") {
				if (textarea.selectionStart === 0) {
					showHeader = false;
					(async () => {
						await delay(50);
						const el = chatbox.lastElementChild;
						scrollToBottom(chatbox);
						el?.focus();
					})();
				} else if (query) {
					e.preventDefault();
					stop();
					textboxQuery.move(-1);
					return;
				}
			}

			if (key === "ArrowDown" && query) {
				e.preventDefault();
				stop();
				textboxQuery.move(1);
				return;
			}

			if (key === "Enter" && query) {
				const selected = query[textboxQuery.select()];
				if (!selected) return;

				e.preventDefault();
				stop();

				const len = queryText.length;
				let replaceWith = "";

				if (queryTitle === 0) {
					const id = selected.id || selected.user.id;
					if (id) replaceWith = `<@${id}> `;
					else {
					}
				}
				if (queryTitle === 1) {
					replaceWith = `<#${selected.id}> `;
				}

				insertMention(replaceWith, getCaret() - len, len);
				query = null;

				return;
			}

			if (!val && key === "ArrowLeft") {
				await back();
				await delay(50);
				sn.focus("channels");
				return;
			}

			if (key === "SoftLeft") {
				if (!val && !$files.length) return;

				stop();

				let _sed = editing ? { id: editing.id, modified: val } : val.startsWith("s/") ? sed(val) : null;

				if (!_sed) {
					if (replying) {
						const message_reference = {
							fail_if_not_exists: false,
							message_id: replying.id,
						};
						discord.sendMessage(channelID, val, { message_reference }, $files);
					} else discord.sendMessage(channelID, val, {}, $files);
					picker.removeFile(-1);
				} else {
					if (!_sed.modified) return;
					discord.editMessage(channelID, _sed.id, _sed.modified);
				}

				value = textarea.value = "";
				replying = editing = null;
				updateHeight();
			}
		}}
	/>
	<div bind:this={after} class="after" />
</div>

<style lang="scss">
	@use "../assets/shared" as *;
	.textbox {
		position: relative;
		/* easy way to plop the elements on top of each other and have them both sized based on the tallest one's height */
		padding: 5px 7px;
		padding-bottom: 2px;
	}
	.after {
		position: absolute;
		width: calc(100% - 14px) !important;
		top: 5px;
		opacity: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.after::after {
		content: " ";
	}
	textarea {
		/* You could leave this, but after a user resizes, then it ruins the auto sizing */
		resize: none;
	}
	textarea,
	.after {
		/* Identical styling required!! */
		word-break: break-all; /* kaios behavior weird*/
		margin: 0;
		border-radius: 5px;

		color: #dcddde;
		padding: 4px 9px;
		font: inherit;
		max-height: 5em;
		font-size: 13px;
		line-height: 1.2;
		white-space: pre-wrap;
		width: 100%;

		border: 1px solid rgba(114, 114, 114, 0.6);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.6);
		@include linearGradient(35%, hsl(210, 8%, 9.8%));
		background-color: hsl(220, 7.6%, 23.3%);
	}
</style>
