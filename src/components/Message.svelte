<script>
	export let message;
	export let roles;
	export let profile;
	export let discordGateway;
	export let cachedMentions;
	export let discord;
	export let channel;
	export let guildID;
	import { onDestroy, onMount } from "svelte";
	import { decimal2rgb, hashCode, wouldMessagePing } from "../lib/helper.js";
	import EmojiDict from "../lib/EmojiDict.js";

	let main;

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
			.replace(/<?(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])>?/gim, '<a href="$1" target="_blank">$1</a>')
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
				/<(@|#|@&)(\d*)>/g,
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

	function linkifyText(inputText) {
		let div = document.createElement("div");
		div.innerHTML = linkify(inputText);
		return div.innerText;
	}

	let contentEl;
	let content = linkify(message.content);

	let onchange = async (el = contentEl) => {
		console.log(message);
		if (!el) return console.error("element not there");
		if (el.childNodes.length === 1 && el.firstChild.className === "emoji") {
			let emoji = el.firstChild.style;
			emoji.setProperty("--emoji_url", emoji.getPropertyValue("--emoji_url").replace("size=16", "size=32"));
			el.firstChild.classList.add("emoji-big");
		}
		let getMentions = (e) => el.querySelectorAll(`span.mentions[data-type='${e}']`);
		if (channel.dm) {
			getMentions("user").forEach((a) => {
				let id = a.dataset.id;
				let user = channel.recipients.find((e) => e.id == id);
				if (!user && discord.user.id === id) user = discord.user;
				if (user) a.innerText = "@" + user.username;
			});
		} else {
			getMentions("role").forEach((a) => {
				let id = a.dataset.id;
				let role = roles.find((e) => e.id === id);
				let text = role?.name || "deleted-role";
				if (role && role.color > 0) {
					let rgb = decimal2rgb(role.color, true);
					Object.assign(a.style, {
						color: `rgb(${rgb})`,
						backgroundColor: `rgb(${rgb},0.3)`,
					});
				}
				a.innerText = text;
			});
			getMentions("user").forEach(async (a) => {
				let id = a.dataset.id;
				let s_profile = id === discord.user.id ? profile : await cachedMentions("getServerProfile", guildID, id);
				a.innerText = "@" + (s_profile.nick || s_profile.user?.username || "unknown-user");
			});
		}
		getMentions("channel").forEach(async (a) => {
			let id = a.dataset.id;
			let text = "deleted-channel";
			if (channel.id === id) text = channel.name;
			else {
				let channel = await cachedMentions("getChannel", id);
				text = channel.name;
			}
			a.innerText = "#" + text;
		});
	};

	let reply;

	onMount(onchange);
	onMount(async () => {
		let temp;
		let messages = main.parentNode;
		if (!messages) return;
		let { referenced_message: ref } = message;
		if (ref) {
			if (/<(@|#|@&)(\d*)>/.test(ref.content)) {
				let msg = messages.querySelector("#msg" + ref.id);
				temp = msg ? msg.innerText : ref.content;
			} else temp = ref.content;
			if (channel.dm) temp = `<b>${"@" + ref.author.username} </b>` + temp;
			else {
				let id = ref.author.id;
				let s_profile = id === discord.user.id ? profile : await cachedMentions("getServerProfile", guildID, id);
				temp = `<b>${"@" + (s_profile.nick || s_profile.user?.username || "unknown-user")} </b>` + temp;
			}
			reply = temp;
		}
	});

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

<main bind:this={main} id={"msg" + message.id}>
	{#if reply}
		<div class="reply">
			<div class="r-icon" />
			<div class="r-text">{@html reply}</div>
		</div>
	{/if}
	<div class="content {message.edited_timestamp ? 'edited' : ''}" bind:this={contentEl}>
		{@html content}
	</div>
</main>

<style>
	.reply {
		display: flex;
		font-size: 9.6px;
		color: rgba(185, 187, 190, 0.5);
	}
	.r-text {
		width: 100%;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
	}
	.r-icon {
		height: 11px;
		width: 11px;
		background-color: rgb(32, 34, 37);
		background-image: url(/css/reply.svg);
		background-position-x: 1px;
		background-position-y: 2px;
		background-size: 80%;
		background-repeat: no-repeat;
		margin-top: 1.5px;
		margin-right: 2px;
		border-radius: 100%;
	}
	main {
		padding-left: 32px;
		font-size: 13px;
		padding-right: 5px;
	}
	.content {
		hyphens: auto;
		white-space: pre-wrap;
		word-wrap: break-word;
	}
	.edited::after {
		content: "(edited)";
		color: rgb(163, 166, 170);
		margin-left: 3px;
		font-size: 0.7em;
	}
</style>
