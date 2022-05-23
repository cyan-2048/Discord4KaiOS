<script>
	export let message;
	export let roles;
	export let profile;
	export let discordGateway;
	export let discord;
	import { onDestroy, onMount } from "svelte";
	import { hashCode, wouldMessagePing } from "../lib/helper.js";

	import EmojiDict from "../lib/EmojiDict.js";

	function linkify(inputText) {
		let backticks = {};
		let blocks = {};

		let output = inputText
			// back ticks always first
			.replace(/```([\s\S]*?)```/g, (a, b, c) => {
				let hash = hashCode(Math.random() + c + b);
				blocks[hash] = a;
				return hash;
			})
			.replace(/`([\s\S]*?)`/g, (a, b, c) => {
				let hash = hashCode(Math.random() + c + b);
				backticks[hash] = a;
				return hash;
			})

			// other stuff starts here

			// markdown bold italics
			.replace(/\*\*\*([\s\S]*?)\*\*\*/g, "<b><i>$1</i></b>")
			// bold
			.replace(/\*\*([\s\S]*?)\*\*/g, "<b>$1</b>")
			// italic
			.replace(/\*([\s\S]*?)\*/g, "<i>$1</i>")
			// underline
			.replace(/__([\s\S]*?)__/g, "<u>$1</u>")
			//italic (no i can't use | because underline)
			.replace(/\s_([\s\S]*?)_\s/g, "<i>$1</i>")
			// strikethrough
			.replace(/~~([\s\S]*?)~~/g, "<s>$1</s>")

			// links/urls

			//URLs starting with http://, https://, or ftp://
			.replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim, '<a href="$1" target="_blank">$1</a>')
			//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
			.replace(/(^|[^\/])(www\.[\S]+(\b|$))/gim, '$1<a href="http://$2" target="_blank">$2</a>')
			//Change email addresses to mailto:: links.
			.replace(/(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim, '<a href="mailto:$1">$1</a>')
			// discord emojis
			.replace(
				/(<a?):\w+:(\d{18}>)?/g,
				(a) =>
					`<div class="emoji" style="--emoji_url: url('https://cdn.discordapp.com/emojis/${a.slice(0, -1).split(":").reverse()[0]}.${
						a.startsWith("<a") ? "gif" : "png"
					}?size=16')"></div>`
			)
			.replace(/@everyone|@here/g, `<span class="mentions">$&</span>`)
			.replace(/:(.*):/g, (a, b) => EmojiDict[b] || a)
			.replace(
				/<(@|#|@&)(\d*)&gt;/g,
				(a, b, c) => `<span class="mentions" data-type="${b == "@&" ? "role" : b == "#" ? "channel" : "user"}" data-id="${c}">${a.slice(1).slice(0, -1)}</span>`
			);
		Object.keys(backticks).forEach((a) => {
			output = output.replace(a, `<code>${backticks[a].slice(0, -1).slice(1)}</code>`);
		});
		Object.keys(blocks).forEach((a) => {
			let res = blocks[a].slice(0, -3).slice(3);
			if (/^\w+\n|^\n/.test(res)) res = res.split("\n").slice(1).join("\n");
			output = output.replace(a, `<pre>${res}</pre>`);
		});
		return output;
	}

	let contentEl;
	let content = linkify(message.content);

	let onchange = async (el = contentEl) => {
		if (!el) return console.log("element not there");
		if (el.childNodes.length === 1 && el.firstChild.className === "emoji") {
			let emoji = el.firstChild.style;
			emoji.setProperty("--emoji_url", emoji.getPropertyValue("--emoji_url").replace("size=16", "size=32"));
			el.firstChild.classList.add("emoji-big");
		}
	};

	onMount(onchange);

	let update = (d) => {
		if (d.id == message.id) {
			if (d.content != message.content) {
				content = linkify(d.content);
				setTimeout(onchange, 50);
			}
			message = d;
		}
	};

	discordGateway.on("t:message_update", update, "msg" + message.id);

	onDestroy(() => {
		// after death remove eventListener for message
		discordGateway.off("t:message_update", update, "msg" + message.id);
	});
</script>

<main>
	<div class="content" bind:this={contentEl}>
		{@html content}
	</div>
</main>

<style>
	main {
		padding-left: 32px;
		font-size: 13px;
		padding-right: 5px;
		white-space: pre-wrap;
	}
	main,
	.content {
		hyphens: auto;
		word-wrap: break-word;
	}
</style>
