<script>
	import { discord } from "../lib/database";

	import { back, delay, last, scrollToBottom } from "../lib/helper";
	import { sn } from "../lib/shared";
	import { messages } from "../routes/stores";

	export let focused = false,
		value = "",
		chatbox,
		editing,
		replying,
		showHeader,
		channelID,
		picker;

	const files = picker.files;

	let textarea, after;

	let query = null;

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
</script>

<div class="textbox">
	<textarea
		on:input={function () {
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

			query = queryFind("#") || queryFind("@") || queryEmoji();

			query && console.error("query:", query);
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

			if (key === "ArrowUp" && textarea.selectionStart === 0) {
				showHeader = false;
				(async () => {
					await delay(50);
					const el = chatbox.lastElementChild;
					scrollToBottom(chatbox);
					el?.focus();
				})();
			}

			if (!val && key === "ArrowLeft")
				return (async () => {
					await back();
					await delay(50);
					sn.focus("channels");
				})();

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
