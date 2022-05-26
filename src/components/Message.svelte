<script>
	export let msg;
	export let roles;
	export let profile;
	export let discordGateway;
	export let cachedMentions;
	export let discord;
	export let channel;
	export let guildID;
	import { onDestroy, onMount } from "svelte";
	import { decimal2rgb, hashCode, wouldMessagePing, toHTML } from "../lib/helper.js";
	import EmojiDict from "../lib/EmojiDict.js";
	import { toHTML as markdown } from "../lib/discord-markdown.js";
	let message = msg;
	let main;

	let pinged;
	$: message && (pinged = wouldMessagePing(message, profile?.roles || [], discord));

	function linkify(inputText) {
		return markdown(inputText || "").replace(/:(.*):/g, (a, b) => EmojiDict[b] || a);
	}

	let contentEl;
	let content = linkify(message.content);

	let onchange = async (el = contentEl) => {
		console.log(message);
		if (!el) return console.error("element not there");
		if (el.childNodes.length === 1) {
			if (el.firstElementChild?.tagName === "A" && message.embeds[0]?.type === "image") {
				el.innerHTML = "";
			} else if (el.firstChild.className === "emoji") {
				let emoji = el.firstChild.style;
				emoji.setProperty("--emoji_url", emoji.getPropertyValue("--emoji_url").replace("size=16", "size=32"));
				el.firstChild.classList.add("emoji-big");
			}
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
		if (pinged && main && main.previousElementSibling?.matches("[data-separator]")) {
			main.previousElementSibling.classList.add("mentioned");
		}
		let temp;
		let messages = main.parentNode;
		if (!messages) return;
		let { referenced_message: ref } = message;
		if (ref) {
			reply = "loading...";
			if (/<(@|#|@&)(\d*)>/.test(ref.content)) {
				let msg = messages.querySelector("#msg" + ref.id);
				temp = msg ? msg.innerText : ref.content;
			} else temp = ref.content;
			if (channel.dm || ref.author.bot) temp = `<b>${"@" + ref.author.username} </b>` + toHTML(temp);
			else {
				let id = ref.author.id;
				let s_profile = id === discord.user.id ? profile : await cachedMentions("getServerProfile", guildID, id);
				temp = `<b>${"@" + (s_profile.nick || s_profile.user?.username || "unknown-user")} </b>` + toHTML(temp);
			}
			reply = temp;
		}
	});

	let update = (d) => {
		if (d.id == message.id) {
			message = { ...message, ...d };
			content = "";
			content = linkify(message.content);
			setTimeout(onchange, 50);
		}
	};

	discordGateway.on("t:message_update", update, "msg" + message.id);

	onDestroy(() => {
		// after death remove eventListener for message
		discordGateway.off("t:message_update", update, "msg" + message.id);
	});

	function onClick(e) {
		let { target } = e;
		if (target.classList.contains("spoiler") && target.tagName === "SPAN") target.classList.toggle("active");
	}

	let decideHeight = (e) => {
		let { height, width } = e;
		if ((width || 0) > 203) {
			return {
				width: 203,
				height: (height / width) * 203,
			};
		} else return { height, width };
	};

	function toggleFocus(e) {
		let { type, target } = e;
		let prev = target.previousElementSibling;
		if (prev?.matches("[data-separator]")) prev.classList[type === "focus" ? "add" : "remove"]("focus");
	}
</script>

<main data-focusable on:blur={toggleFocus} on:focus={toggleFocus} class={pinged ? "mention" : ""} tabindex="0" bind:this={main} id={"msg" + message.id}>
	{#if reply}
		<div class="reply">
			<div class="r-icon" />
			<div class="r-text">{@html reply}</div>
		</div>
	{/if}
	<div on:click={onClick} class="content {message.edited_timestamp ? 'edited' : ''}" bind:this={contentEl}>
		{@html content}
	</div>
	{#if message.attachments && message.attachments[0]}
		{#each message.attachments as attachment (attachment.id)}
			{#if attachment.content_type?.startsWith("image")}
				<img src={attachment.proxy_url} {...decideHeight(attachment)} alt />
			{/if}
		{/each}
	{/if}
	{#if message.embeds && message.embeds[0]}
		{#each message.embeds as embed}
			{#if embed.type !== "image"}
				<div style={embed.color ? `--line_color: rgb(${decimal2rgb(embed.color, true)});` : ""} class="embed">
					{#if embed.description}
						<div class="embed-desc">{@html markdown(embed.description, { embed: true })}</div>
					{/if}
				</div>
			{:else}
				<img src={embed.thumbnail.proxy_url} {...decideHeight(embed.thumbnail)} alt />
			{/if}
		{/each}
	{/if}
</main>

<style>
	main:not(.mention):focus {
		background-color: #32353b;
	}

	main.mention:focus {
		background-color: #3c3831;
	}
	main.mention {
		background-color: #49443c;
	}

	.content + .embed {
		margin-top: 4px;
	}
	.embed {
		padding: 8px;
		padding-left: 5px;
		border-left: 3px solid;
		border-color: var(--line_color, #202225);
		margin-bottom: 4px;
		background-color: rgb(47, 49, 54);
		border-radius: 3px;
	}
	.embed-desc {
		font-size: 11px;
	}
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
