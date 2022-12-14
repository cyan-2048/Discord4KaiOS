<script>
	// components
	import LottieSticker from "./LottieSticker.svelte";
	import ReactionButton from "./ReactionButton.svelte";
	import Sticker from "./Sticker.svelte";
	import GifV from "./GifV.svelte";
	import MessageContent from "./MessageContent.svelte";

	// js imports
	import { onDestroy, tick } from "svelte";
	import { centerScroll, decideHeight, niceBytes } from "../lib/helper.js";
	import { discord, discordGateway } from "../lib/database";

	import EmojiDict from "../lib/EmojiDict.js";

	import { serverProfiles, settings, userProfiles } from "../lib/shared";
	import { multipleEventHandler } from "../lib/EventEmitter.js";

	import Mentions from "./Mentions.svelte";
	import { showImage } from "../modals";

	if ($settings.devmode) {
		window.EmojiDict = EmojiDict;
	}

	export let guildID,
		pinged = false,
		roles = null,
		messages,
		message,
		channelID,
		chatbox,
		textbox;

	if (message?.author?.id) $userProfiles.set(message.author.id, message.author);

	let main;

	export let editing = false;
	export let replying = false;
	$: deleted = message.deleted;

	let contentEl;
	/*
	let messageContent = message.content;
	let content = [0, 19, 20].includes(message.type)
		? linkify(messageContent, { embed: !!message.author.bot })
		: message.type in todo_types
		? toHTML(todo_types[message.type] + ` <TODO type=${message.type} 🙂>`)
		: linkify(`\`\`\`unknown type: ${message.type}\ncontent: ${message.content}\nask dev for fix 🙂\`\`\``);
		*/

	let reply = null;

	/*
	$: if (content && contentEl) {
		contentEl.innerHTML = "";
		contentEl.append(content);
	}
	*/

	function testEmojiFont(element) {
		if (message.content === "") return;
		function testString(string) {
			const filtered = Array.from(string).filter((a) => a !== " " && a !== "\n");

			// assume everything is emoji
			// if exceeds max then it is false
			if (filtered.length > 27) return false;

			return filtered.every((a) => EmojiDict.search(a)) || (string.includes("️") && EmojiDict.search(string));
		}
		const clone = element.cloneNode(true);
		clone.querySelectorAll(".emoji").forEach((a) => {
			try {
				a.parentNode.replaceChild(document.createTextNode("💀"), a);
			} catch (e) {}
		});

		testString(clone.innerText) && element.classList.add("emoji-big");
	}

	async function updateElement(serverProfiles, message, contentEl, roles) {
		await tick();
		if (!contentEl) return;

		if (contentEl.childNodes.length === 1) {
			if (contentEl.firstElementChild?.tagName === "A" && main.querySelectorAll(".v-image").length === 1) {
				contentEl.style.display = "none";
			}
		} else {
			contentEl.style.removeProperty("style");
		}

		testEmojiFont(contentEl);
	}

	$: updateElement($serverProfiles, message, contentEl, roles);

	onDestroy(() => {
		if (main !== document.activeElement) return;
		let next = main.nextElementSibling;
		if (next) {
			while (next) {
				if (next.matches("[data-focusable]")) return next.focus();
				next = next.nextElementSibling;
			}
		} else {
			next = main.previousElementSibling;
			if (next) {
				if (next.matches("[data-focusable]")) return next.focus();
				next = next.previousElementSibling;
			}
		}
	});

	function updateReactions({ message_id, emoji, user_id }, remove = false) {
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
	}

	onDestroy(
		multipleEventHandler(discordGateway, {
			"t:message_update": function ({ detail: d }) {
				if (d.id === message.id) {
					message = { ...message, ...d };
				}
			},
			"t:message_delete": function ({ detail: d }) {
				if (d.id === message.id) {
					if ($settings.preserve_deleted) {
						message.deleted = true;
					} else $messages = $messages.filter(({ id }) => id !== message.id);
				}
			},
			"t:message_reaction_add": (d) => updateReactions(d.detail),
			"t:message_reaction_remove": (d) => updateReactions(d.detail, true),
		})
	);
</script>

<main
	class:deleted
	class:editing
	class:replying
	class:userMessage={message.author.id === discord.user.id}
	data-focusable
	class:mention={pinged}
	tabindex="0"
	on:keydown={({ key }) => {
		if (key == 0) {
			centerScroll(chatbox.lastElementChild);
			textbox?.focus();
		}
	}}
	bind:this={main}
	id={"msg" + message.id}
>
	{#if message.referenced_message || message.interaction}
		{@const ref = message.referenced_message || message.interaction}
		{@const user = ref.author || ref.user}
		<div class="reply">
			<div class="r-icon" />
			<div class="r-text">
				<b
					><Mentions
						{guildID}
						mentions={false}
						type="user"
						username={user.username}
						id={user.id}
						{roles}
						prefix={false}
					/>
				</b>
				<span
					>{" "}
					{#if message.referenced_message}
						<MessageContent {roles} {guildID} content={ref.content} />
					{:else}
						<MessageContent
							options={{ embed: true }}
							content="used [/{ref.name}](https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
						/>
					{/if}
				</span>
			</div>
		</div>
	{/if}
	<slot />
	<div
		on:click={function onClick(e) {
			let { target } = e;
			if (target.classList.contains("spoiler") && target.tagName === "SPAN") target.classList.toggle("active");
		}}
		class="content"
		style:display={message.content === "" ? "none" : null}
		class:edited={!!message.edited_timestamp}
		bind:this={contentEl}
	>
		{#if [0, 19, 20].includes(message.type)}<MessageContent
				{guildID}
				{roles}
				content={message.content}
				options={{ embed: !!message.author.bot }}
			/>{:else}
			UNKNOWN MESSAGE TYPE TYPE:{message.type}
			CONTENT:{message.content}
		{/if}
	</div>
	{#if message.attachments && message.attachments[0]}
		{#each message.attachments as attachment (attachment.id)}
			{#if attachment.content_type?.startsWith("image")}
				<img
					class="v-image"
					data-filename={attachment.filename}
					data-url={attachment.url}
					src={attachment.proxy_url}
					{...decideHeight(attachment, 200)}
					on:click={() => {
						const { url: download, proxy_url: src, filename: file } = attachment;
						showImage({ src, download, file });
					}}
					alt
				/>
			{:else}
				<div class="default_attachment">
					<div class="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							fill="currentColor"
							class="bi bi-file-earmark"
							viewBox="0 0 16 16"
						>
							<path
								d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"
							/>
						</svg>
					</div>
					<div class="text">
						<div class="filename"><a href={attachment.url}>{attachment.filename}</a></div>
						<div class="size">{niceBytes(attachment.size)}</div>
					</div>
				</div>
			{/if}
		{/each}
	{/if}
	{#if message.embeds && message.embeds[0]}
		{#each message.embeds as embed}
			{#if embed.type === "image" || embed.type === "gifv"}
				{#if embed.type === "gifv"}
					<GifV size={decideHeight(embed.thumbnail)} {embed} />
				{:else}
					{@const src = embed.thumbnail.proxy_url}
					<img
						data-url={embed.url}
						class="v-image"
						{src}
						{...decideHeight(embed.thumbnail)}
						alt
						on:click={() => {
							const { url: download } = embed;
							showImage({ src, download });
						}}
					/>
				{/if}
			{:else}
				<div style={embed.color ? `--line_color: #${Number(embed.color).toString(16)});` : ""} class="embed">
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
						<div class="embed-title">
							<MessageContent {guildID} {roles} content={embed.title} options={{ embed: true }} />
						</div>
					{/if}
					{#if embed.description}
						<div class="embed-desc">
							<MessageContent {guildID} {roles} content={embed.description} options={{ embed: true }} />
						</div>
					{/if}
					{#if embed.thumbnail}
						<img class="thumb" {...decideHeight(embed.thumbnail, 187, 50)} src={embed.thumbnail.proxy_url} alt />
					{/if}
					{#if embed.fields && embed.fields[0]}
						{#each embed.fields as field}
							<div class="field {field.inline ? 'inline' : ''}">
								<div class="field-t">
									<MessageContent {guildID} {roles} content={field.name} options={{ embed: true }} />
								</div>
								<div class="field-v">
									<MessageContent {guildID} {roles} content={field.value} options={{ embed: true }} />
								</div>
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
				<Sticker id={sticker.id} name={sticker.name} />
			{/if}
		{/each}
	{/if}
	{#if message.reactions && message.reactions[0]}
		<div class="reactions">
			{#each message.reactions as reaction ((reaction.emoji.id || "") + reaction.emoji.name)}
				<ReactionButton {message} {channelID} {reaction} />
			{/each}
		</div>
	{/if}
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	@mixin emphasize($color1, $color2) {
		@include linearGradient(30%, $color1, !important);
		background-color: $color2 !important;
		box-shadow: inset 0 0 0 1px rgba(230, 230, 230, 0.4) !important;
		border-radius: 0px;
	}

	@mixin emphasizeFocus($color1, $color2) {
		@include linearGradient(30%, $color1, !important);
		background-color: $color2 !important;
		box-shadow: inset 0 0 0 1px rgba(230, 230, 230, 0.6) !important;
	}

	main {
		padding-left: 34px;
		font-size: 13px;
		padding-right: 5px;
		padding-bottom: 2px;
		padding-top: 2px;

		&:focus,
		&.mention {
			@extend %MessageFocus;
		}

		&:not(.mention):focus {
			background-color: hsla(204, 7.7%, 12.7%, 0.6);
		}

		&.mention {
			@include linearGradient(20%, hsla(56, 37.6%, 56.7%, 0.4));
			background-color: hsla(42, 97.7%, 33.5%, 0.4) !important;

			&:focus {
				@include linearGradient(20%, hsla(57, 47.4%, 66.5%, 0.6), !important);
				background-color: hsla(38, 77.8%, 44.1%, 0.6) !important;
			}
		}

		&.deleted {
			background-color: #4a3a40;

			&:focus {
				background-color: #44373c !important;
			}
		}

		&.replying {
			@include emphasize(hsla(221, 37.6%, 56.7%, 0.4), hsla(197, 97.7%, 33.5%, 0.4));

			&:focus {
				@include emphasizeFocus(hsla(211, 45.9%, 64.5%, 0.4), hsla(197, 79.1%, 41.4%, 0.4));
			}
		}

		&.editing {
			@include emphasize(hsla(204, 20%, 4.9%, 0.8), hsla(204, 5.9%, 16.7%, 0.8));

			&:focus {
				@include emphasizeFocus(hsla(204, 20%, 4.9%, 0.8), hsla(204, 5.9%, 16.7%, 0.8));
			}

			border-radius: 5px !important;
			box-shadow: inset 0 0 0 1px rgba(28, 29, 30), inset 0 0 0 2px rgba(134, 134, 134, 0.8) !important;
			// background-color: #32353b;
		}

		.reactions {
			display: flex;
			flex-wrap: wrap;
		}
	}

	.default_attachment {
		display: flex;
		border: 1px #292b2f solid;
		background-color: #2f3136;
		border-radius: 3px;
		padding: 2px;
		overflow: hidden;

		.icon {
			width: 25px;
			display: flex;
			color: #dcddde;

			svg {
				margin: auto;
			}
		}

		.text {
			padding-left: 2px;
			width: 100%;
			display: flex;
			flex-direction: column;
			flex-grow: 1;
			overflow: hidden;

			* {
				text-overflow: ellipsis;
				overflow: hidden;
				white-space: nowrap;
				width: 100%;
			}

			.size {
				color: grey;
				font-size: 11px;
			}
		}
	}

	img {
		display: block;
	}

	.content {
		hyphens: auto;
		white-space: pre-wrap;
		word-wrap: break-word;

		&.edited::after {
			content: "(edited)";
			color: #a3a6aa;
			margin-left: 3px;
			font-size: 9.1px;
		}

		+ .embed {
			margin-top: 4px;
			word-wrap: break-word;
			hyphens: auto;
		}

		&:global(.emoji-big .emoji),
		&:global(.emoji-big .emoji::before) {
			width: 32px !important;
			height: 32px !important;
		}

		&:global(.emoji-big) {
			font-size: 32px;
			line-height: 1;
			padding-top: 1.5px;
			padding-bottom: 1.5px;
		}

		:global {
			pre,
			code {
				font-family: "Droid Sans Mono", monospace;
				border-radius: 3px;
				background-color: #2f3136;
			}

			code {
				font-size: 0.9em;
				padding: 1px;
			}

			pre {
				margin: 2px 0;
				border: solid 1.5px #202225;
				padding: 2px 5px;
				word-break: break-all;
				white-space: pre-wrap;

				&:first-child {
					margin-top: 0;
				}
			}

			.spoiler {
				width: 100%;
				height: 100%;
				background-color: #202225;
				color: transparent;

				&.active {
					background-color: hsla(0, 0%, 100%, 0.1);
					color: white;
				}
			}

			blockquote {
				margin: 0;
				padding-left: 8px;
				position: relative;

				&::before {
					content: "";
					position: absolute;
					height: 100%;
					width: 3px;
					left: 0;
					top: 0;
					background-color: #4f545c;
					border-radius: 3px;
				}
			}
		}
	}

	.embed {
		padding: 8px;
		padding-left: 5px;
		border-left: 3px solid;
		border-color: var(--line_color, #202225);
		margin-bottom: 4px;
		background-color: #2f3136;
		border-radius: 3px;

		> *:not(:last-child) {
			margin-bottom: 2px;
		}

		.embed-desc {
			font-size: 11px;
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
	}

	.reply {
		display: flex;
		font-size: 9.6px;
		color: rgba(185, 187, 190, 0.5);

		.r-text {
			width: 100%;
			height: 14px;
			text-overflow: ellipsis;
			white-space: nowrap;
			overflow: hidden;

			:global(.emoji) {
				width: 10px !important;
				height: 10px !important;
			}
		}
		.r-icon {
			height: 12px;
			width: 13px;
			background-image: url(/css/reply_.png);
			margin-top: 1.5px;
			margin-right: 2px;
			background-size: contain;
			background-repeat: no-repeat;
			margin-left: -15px;
		}
	}
</style>
