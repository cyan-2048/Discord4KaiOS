<script context="module">
	import { createEventDispatcher, onMount, tick } from "svelte";
	import { decimal2rgb, wouldMessagePing, toHTML, decideHeight, delay, customDispatch } from "../lib/helper.js";
	async function handleSiblingColor(el) {
		await tick();
		const prev = el.previousElementSibling;
		if (prev && prev.matches("[data-separator]")) {
			customDispatch(prev, "change_color");
		}
	}
</script>

<script>
	// components
	import LottieSticker from "./LottieSticker.svelte";
	import ReactionButton from "./ReactionButton.svelte";

	// js imports
	import { toHTML as markdown } from "../lib/discord-markdown.js";
	import { evtForward, discord, discordGateway } from "../lib/shared";
	const dispatch = createEventDispatcher();
	import EmojiDict from "../lib/EmojiDict.js";

	// props
	export let roles;
	export let profile;
	export let cachedMentions;
	export let channel;
	export let guildID;

	let message = { ...$$props.msg }; // get rid of reference, well let's just hope it doesn't change yeah
	let main;

	const greetings = [
		"$user joined the party.",
		"$user is here.",
		"Welcome, $user. We hope you brought pizza.",
		"A wild $user appeared.",
		"$user just landed.",
		"$user just slid into the server.",
		"$user just showed up!",
		"Welcome $user. Say hi!",
		"$user hopped into the server.",
		"Everyone welcome $user!",
		"Glad you're here, $user.",
		"Good to see you, $user.",
		"Yay you made it, $user!",
	];

	let pinged;
	let editing = false;
	let replying = false;
	$: message && (pinged = wouldMessagePing(message, profile?.roles || [], discord));

	function linkify(inputText, opts = {}) {
		if (inputText === "") return "";
		return markdown(inputText || "", opts).replace(/:(.*):/g, (a, b) => EmojiDict.search(b) || a);
	}

	let contentEl;
	let content =
		message.type === 7
			? linkify(greetings[new Date(message.timestamp) % greetings.length].replace("$user", `<@${message.author.id}>`))
			: linkify(message.content, { embed: !!message.author.bot });

	let reply;

	onMount(async () => {
		let temp;
		let messages = main.parentNode;
		if (!messages) return;
		let { referenced_message: ref } = message;
		if (ref) {
			reply = ref.author.username || "loading...";
			let _m = /<(@|#|@&)(\d*)>/g;
			if (_m.test(ref.content)) {
				let msg = messages.querySelector("#msg" + ref.id);
				temp = msg
					? await new Promise((r) => {
							if (msg.loaded) r(msg.innerText);
							else msg.loaded = () => r(msg.innerText);
					  })
					: ref.content?.replace(_m, "") || "";
			} else temp = ref.content;
			if (channel.dm || (ref.author.bot && ref.author.discriminator === "0000"))
				temp = `<b>${"@" + ref.author.username} </b>` + toHTML(temp);
			else {
				let id = ref.author.id;
				let s_profile = id === discord.user.id ? profile : await cachedMentions("getServerProfile", guildID, id);
				temp =
					`<b>${"@" + (s_profile.nick || s_profile.user?.username || ref.author.username || "unknown-user")} </b>` +
					toHTML(temp);
			}
			reply = temp;
		}
	});
	onMount(() => {
		let onchange = async (el = contentEl) => {
			if (!el) return console.error("message element not found");
			if (el.childNodes.length === 1) {
				let embed_type = message.embeds[0]?.type;
				if (el.firstElementChild?.tagName === "A" && (embed_type === "image" || embed_type === "gifv")) {
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
					let text = "@" + (role?.name || "deleted-role");
					if (role && role.color > 0) {
						let rgb = decimal2rgb(role.color, true);
						Object.assign(a.style, {
							color: `rgb(${rgb})`,
							backgroundColor: `rgb(${rgb},0.3)`,
						});
					}
					a.innerText = text;
				});
				for (const a of getMentions("user")) {
					let id = a.dataset.id;
					let s_profile = id === discord.user.id ? profile : await cachedMentions("getServerProfile", guildID, id);
					if (!s_profile || s_profile.httpStatus === 404)
						s_profile = message.author.id === id ? message.author : await cachedMentions("getProfile", id);
					a.innerText =
						"@" +
						(s_profile.nick ||
							s_profile.user?.username ||
							s_profile.username ||
							(message.author.id === id ? message.author.username : null) ||
							"unknown-user");
				}
			}
			for (const a of getMentions("channel")) {
				let id = a.dataset.id;
				let text = "deleted-channel";
				if (channel.id === id) text = channel.name;
				else {
					let channel = await cachedMentions("getChannel", id);
					text = channel.name;
				}
				a.innerText = "#" + text;
			}
			typeof el.parentNode.loaded === "function" && el.parentNode.loaded();
			el.parentNode.loaded = true;
		};
		let update = async (d) => {
			if (d.id == message.id) {
				message = { ...message, ...d };
				dispatch("update", { message });
				content = "";
				content = d.author?.bot ? markdown(message.content, { embed: true }) : linkify(message.content);
				await tick();
			}
		};
		onchange();
		discordGateway.on("t:message_update", update, "msg" + message.id);

		let updateReactions = ({ message_id, emoji, user_id }, remove = false) => {
			if (message_id !== message.id) return;
			let reaction, reactionIndex;
			if (!message.reactions) message.reactions = [];
			else
				reaction = message.reactions.find(({ emoji: e }, i) => {
					if (emoji.name === e.name && emoji.id === e.id) {
						reactionIndex = i;
						return true;
					}
				});
			const me = user_id === discord.user.id;
			if (reaction) {
				let original = { ...reaction };

				if (remove) {
					if (me) original.me = false;
					original.count -= 1;
				} else {
					if (me) original.me = true;
					original.count += 1;
				}
				console.log("original count:", original.count);
				if (original.count > 0)
					message.reactions = message.reactions.map((item, i) => {
						if (i === reactionIndex) return original;
						return item;
					});
				else message.reactions = message.reactions.filter((e, i) => i !== reactionIndex);
			} else if (!remove) {
				const temp = { me, count: 1, emoji };
				if (message.reactions.length === 0) message.reactions = [temp];
				else message.reactions = [...message.reactions, temp];
			}
		};
		let removeReaction = (d) => updateReactions(d, true);

		discordGateway.on("t:message_reaction_add", updateReactions, "msg" + message.id);
		discordGateway.on("t:message_reaction_remove", removeReaction, "msg" + message.id);

		const _editing = () => {
			editing = false;
			handleSiblingColor(main);
		};
		const _replying = () => {
			replying = false;
			handleSiblingColor(main);
		};

		evtForward.on("stop_editing:" + message.id, _editing, "msg" + message.id);
		evtForward.on("stop_replying:" + message.id, _replying, "msg" + message.id);

		return () => {
			// after death remove eventListener for message
			evtForward.off("stop_editing:" + message.id, _editing, "msg" + message.id);
			evtForward.off("stop_replying:" + message.id, _replying, "msg" + message.id);
			discordGateway.off("t:message_update", update, "msg" + message.id);
			discordGateway.off("t:message_update", update, "msg" + message.id);
			discordGateway.off("t:message_update", update, "msg" + message.id);
			discordGateway.off("t:message_reaction_add", updateReactions, "msg" + message.id);
			discordGateway.off("t:message_reaction_remove", removeReaction, "msg" + message.id);
		};
	});
</script>

<main
	class:editing
	class:replying
	on:dblclick={async function handleEdit(e) {
		handleSiblingColor(this);
		if (message.author.id !== discord.user.id) {
			return customDispatch(this, "reply");
		}
		if (editing || this.querySelector("[data-sticker]")) return; // you can't edit sticker messages
		let clone = contentEl.cloneNode(true);
		let mentioned = [];
		for (const a of clone.querySelectorAll("span.mentions[data-type='user']")) {
			const id = a.dataset.id;
			let user = await cachedMentions.findUserById(id);
			if (!user.username) user = { username: "unknown-user", discriminator: "0000" };
			else if (!mentioned.find((a) => a.id === id)) mentioned.push(user);
			a.innerText = `@${user.username}#${user.discriminator}`;
		}
		message.mention_roles?.forEach((a) => {
			const role = roles.find((e) => e.id === a);
			role && mentioned.push(role);
		});
		editing = true;
		evtForward.emit("message_edit", message, clone.innerText, mentioned);
	}}
	on:options={function () {
		evtForward.emit("message_options", message, this);
	}}
	on:reply={function () {
		if (replying) return;
		replying = true;
		handleSiblingColor(this);
		evtForward.emit("message_reply", message, this);
	}}
	on:delete={() => {
		discord.deleteMessage(channel.id, message.id);
	}}
	data-focusable
	class:mention={pinged}
	tabindex="0"
	bind:this={main}
	id={"msg" + message.id}
>
	{#if reply}
		<div class="reply">
			<div class="r-icon" />
			<div class="r-text">{@html reply}</div>
		</div>
	{/if}
	<div
		on:click={function onClick(e) {
			let { target } = e;
			if (target.classList.contains("spoiler") && target.tagName === "SPAN") target.classList.toggle("active");
		}}
		class="content"
		class:edited={!!message.edited_timestamp}
		bind:this={contentEl}
	>
		{@html content}
	</div>
	{#if message.attachments && message.attachments[0]}
		{#each message.attachments as attachment (attachment.id)}
			{#if attachment.content_type?.startsWith("image")}
				<img
					class="v-image"
					data-filename={attachment.filename}
					data-url={attachment.url}
					src={attachment.proxy_url}
					{...decideHeight(attachment)}
					alt
				/>
			{/if}
		{/each}
	{/if}
	{#if message.embeds && message.embeds[0]}
		{#each message.embeds as embed}
			{#if embed.type === "image" || embed.type === "gifv"}
				<img
					data-url={embed.url}
					class="v-image"
					src={embed.type === "gifv" ? embed.url + ".gif" : embed.thumbnail.proxy_url}
					{...decideHeight(embed.thumbnail)}
					alt
				/>
			{:else}
				<div style={embed.color ? `--line_color: rgb(${decimal2rgb(embed.color, true)});` : ""} class="embed">
					{#if embed.provider}
						{#if embed.provider.name}
							<div class="embed-p-name">{embed.provider.name}</div>
						{/if}
					{/if}
					{#if embed.author}
						{#if embed.author.name}
							<div class="embed-a-name">{embed.author.name}</div>
						{/if}
					{/if}
					{#if embed.title && embed.type !== "rich"}
						<div class="embed-title">
							{#if embed.url}
								<a href={embed.url}>{embed.title}</a>
							{:else}
								{embed.title}
							{/if}
						</div>
					{/if}
					{#if embed.title && embed.type === "rich"}
						<div class="embed-title">{@html linkify(embed.title, { embed: true })}</div>
					{/if}
					{#if embed.description}
						<div class="embed-desc">{@html linkify(embed.description, { embed: true })}</div>
					{/if}
					{#if embed.thumbnail}
						<img class="thumb" {...decideHeight(embed.thumbnail, 187, 50)} src={embed.thumbnail.proxy_url} alt />
					{/if}
					{#if embed.fields && embed.fields[0]}
						{#each embed.fields as field}
							<div class="field {field.inline ? 'inline' : ''}">
								<div class="field-t">{@html linkify(field.name, { embed: true })}</div>
								<div class="field-v">{@html linkify(field.value, { embed: true })}</div>
							</div>
						{/each}
					{/if}
					{#if embed.image}
						<img src={embed.image.url} {...decideHeight(embed.image, 187)} alt class="thumb" />
					{/if}
					{#if embed.timestamp}
						<div class="timestamp">{new Date(embed.timestamp).toLocaleDateString()}</div>
					{/if}
				</div>
			{/if}
		{/each}
	{/if}
	{#if message.sticker_items && message.sticker_items[0]}
		{#each message.sticker_items as sticker}
			{#if sticker.format_type === 3}
				<LottieSticker src="https://discord.com/stickers/{sticker.id}.json" />
			{:else}
				<img
					data-sticker
					src="https://media.discordapp.net/stickers/{sticker.id}.png?size=160"
					width="160"
					height="160"
					alt="Sticker: {sticker.name}"
				/>
			{/if}
		{/each}
	{/if}
	{#if message.reactions && message.reactions[0]}
		<div class="reactions">
			{#each message.reactions as reaction ((reaction.emoji.id || "") + reaction.emoji.name)}
				<ReactionButton {...reaction} />
			{/each}
		</div>
	{/if}
</main>

<style>
	.replying {
		background-color: #373b49;
	}
	.editing {
		background-color: #32353b;
	}
	.embed > *:not(:last-child) {
		margin-bottom: 2px;
	}
	img {
		display: block;
	}
	.timestamp {
		font-size: 10px;
	}
	.field {
		width: 50%;
	}
	.field.inline {
		display: inline-block;
	}
	.embed-a-name,
	.embed-p-name,
	.field {
		font-size: 11px;
	}
	.embed-a-name,
	.field-t {
		font-weight: bold;
	}
	.embed-title {
		font-size: 13px;
	}

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
		word-wrap: break-word;
		hyphens: auto;
	}
	.embed {
		padding: 8px;
		padding-left: 5px;
		border-left: 3px solid;
		border-color: var(--line_color, #202225);
		margin-bottom: 4px;
		background-color: #2f3136;
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
		background-position: center;
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

	.content :global(.emoji) {
		position: relative;
		width: 16px;
		height: 16px;
		display: inline-block;
	}

	.content :global(.emoji::after) {
		content: "";
		position: absolute;
		background-image: var(--emoji_url);
		width: 16px;
		height: 16px;
		top: 3px;
		background-position: center;
		background-repeat: no-repeat;
		background-attachment: local;
		overflow: hidden;
		background-size: contain;
	}

	:global(.grow-wrap .after .mentions),
	:global(.grow-wrap .after .mentions::after),
	.content :global(.mentions),
	.content :global(.mentions::after) {
		background-color: var(--color, rgba(88, 101, 242, 0.3));
		border-radius: 2px;
		color: #dee0fc;
	}

	.content :global(.emoji-big),
	.content :global(.emoji-big::after) {
		width: 32px !important;
		height: 32px !important;
	}

	.content :global(pre),
	.content :global(code) {
		font-family: "Droid Sans Mono", monospace;
		border-radius: 3px;
		background-color: #2f3136;
	}

	.content :global(code) {
		font-size: 0.9em;
		padding: 1px;
	}

	.content :global(pre) {
		margin: 2px 0;
		border: solid 1.5px #202225;
		padding: 2px 5px;
		word-break: break-all;
		white-space: pre-wrap;
	}

	.content :global(.spoiler) {
		width: 100%;
		height: 100%;
		background-color: #202225;
		color: transparent;
	}

	.content :global(.spoiler.active) {
		background-color: hsla(0, 0%, 100%, 0.1);
		color: white;
	}

	.content :global(blockquote) {
		margin: 0;
		padding-left: 8px;
		position: relative;
	}

	.content :global(blockquote::before) {
		content: "";
		position: absolute;
		height: 100%;
		width: 3px;
		left: 0;
		top: 0;
		background-color: #4f545c;
		border-radius: 3px;
	}
</style>
