<script>
	import { onDestroy, onMount, tick } from "svelte";
	import Message from "../components/Message.svelte";
	import JoinMessage from "../components/JoinMessage.svelte";
	import Textbox from "../components/Textbox.svelte";
	import { ack, discord, discordGateway, isServerOwner } from "../lib/database";
	import { back, delay, parseRoleAccess, scrollToBottom, wouldMessagePing, getScrollBottom, centerScroll, last, inViewport, changeStatusbarColor, navigate } from "../lib/helper";
	import { serverProfiles, longpress, sn, settings, queryProfiles, pushOptions } from "../lib/shared";
	if ($settings.devmode) Object.assign(window, { discord, discordGateway });
	import { messages, _guildID, _channelID, _channel, typingState, picker } from "./stores";
	import MessageSeparator from "../components/MessageSeparator.svelte";
	import DateSeparator from "../components/DateSeparator.svelte";
	import Upload from "../icons/Upload.svelte";
	import { eventHandler, multipleEventHandler } from "../lib/EventEmitter";
	import BoostMessage from "../components/BoostMessage.svelte";
	import PinnedMessage from "../components/PinnedMessage.svelte";
	import Button from "../components/Button.svelte";
	import { snackbar } from "../modals";
	import Mentions from "../components/Mentions.svelte";
	import CallMessage from "../components/CallMessage.svelte";

	export let guildID = null;
	export let channelID = null;
	export let mounted;

	let chatbox,
		textbox,
		textbox_text,
		textboxFocused,
		showHeader = true;

	const files = picker.files;

	let channelPermissions = null,
		channel = null,
		roles = null;

	$: channelName = $_channel?.name || $_channel?.recipients?.map((x) => x.username).join(", ");

	function debug_channel_perms(channelPermissions) {
		$settings.devmode && console.log(channelPermissions);
	}

	$: debug_channel_perms(channelPermissions);

	$: readOnly = !!channelPermissions && channelPermissions.write === false;

	if ($settings.devmode) {
		window.picker = picker;
	}

	let loading = true;
	let editing = null;
	let replying = null;

	$: guildID && queryProfiles.clear();

	onMount(() => {
		const interval = setInterval(() => {
			if (guildID === "@me" || queryProfiles.size === 0) return;

			queryProfiles.forEach((a) => {
				if ($serverProfiles.has(guildID + "/" + a)) {
					queryProfiles.delete(a);
				}
			});

			if (queryProfiles.size !== 0) {
				discordGateway.send({
					op: 8,
					d: {
						guild_id: [guildID],
						query: undefined,
						limit: undefined,
						presences: true,
						user_ids: [...queryProfiles],
					},
				});
			}
		}, 1500);

		return () => clearInterval(interval);
	});

	changeStatusbarColor("#1d1d1d");

	async function loadMessages(guildID, channelID) {
		const isDM = guildID === "@me";

		roles = isDM ? null : await discord.getRoles(guildID);
		$_channel = channel = await discord.getChannel(channelID);
		const serverProfile = !isDM && ($serverProfiles.get(guildID + "/" + discord.user.id) || (await discord.getServerProfile(guildID, discord.user.id)));

		channelPermissions = isDM
			? {}
			: parseRoleAccess(
					channel.permission_overwrites,
					serverProfile.roles?.concat([roles.find((p) => p.position == 0).id, serverProfile.user.id]),
					roles,
					await isServerOwner(guildID)
			  );

		await tick();
		if (!readOnly) delay(50).then(() => textbox?.focus());

		if ($_channelID !== channelID) {
			replying = editing = null;
			$messages = [];
			loading = true;

			try {
				$_guildID = guildID;
				$_channelID = channelID;
				$messages = (await discord.getMessages(channel.id, 15)).reverse();
				$settings.devmode && console.log("messages:", $messages);
				await tick();
			} catch (e) {}
		} else {
			loading = false;
		}

		await tick();
		await delay(5);
		scrollToBottom(chatbox);
		ack(channelID);
		if (readOnly) last(chatbox.children)?.focus();

		if (!isDM) {
			const user_ids = [...new Set($messages.map((a) => a?.author?.id))].filter((a) => a && !$serverProfiles.has(guildID + "/" + a));
			if (user_ids.length !== 0) user_ids.forEach((id) => queryProfiles.add(id));
		}

		loading = false;
	}

	$: $mounted && loadMessages(guildID, channelID);

	function oxford(raw, conjunction, ifempty) {
		let arr = [...raw]; // clone
		let l = arr.length;
		if (!l) return ifempty;
		if (l < 2) return arr[0];
		if (l < 3) return arr.join(` ${conjunction} `);
		arr = arr.slice();
		arr[l - 1] = `${conjunction} ${arr[l - 1]}`;
		return arr.join(", ");
	}

	onMount(() => {
		sn.add("messages", {
			selector: "[data-messages] [data-focusable]",
			restrict: "self-only",
		});

		return () => sn.remove("messages");
	});

	onDestroy(
		eventHandler(discordGateway, "t:message_create", async (event) => {
			var { detail: d } = event || {};

			if (channelID === d.channel_id && chatbox) {
				const shouldScroll = textboxFocused || getScrollBottom(chatbox) < 100;
				await tick();
				if (shouldScroll) {
					(await centerScroll(chatbox.lastElementChild, !$settings.smooth_scroll || $longpress)) && ack(channelID);
				}
			}
		})
	);

	async function _back() {
		await back();
		await delay(50);
		sn.focus("channels");
	}

	let nav_busy = false;

	onDestroy(
		multipleEventHandler(
			window,
			{
				async keydown({ key }) {
					if (nav_busy) return;
					nav_busy = true;
					if (key === "Backspace" || key === "SoftLeft") {
						_back();
					}
					if (key === "SoftRight") {
						let actEl = document.activeElement;
						if (textboxFocused) {
							if (replying || editing) {
								if (editing) textbox.replaceText("");
								replying = editing = null;
							} else {
								const result = await $pushOptions([
									...$files.map((a) => ({ name: "Remove: " + a.name, id: a })),
									{ id: "file", name: "Upload File" },
									{ id: "settings", name: "Settings" },
								]);

								switch (result) {
									case "settings":
										navigate("/settings");
										break;
									case "file":
										picker.addFile();
										break;
									default:
										if ($files.includes(result)) {
											picker.removeFile(result);
										} else if (result) snackbar("NOT IMPLEMENTED");
										break;
								}
							}
						} else {
							const message = $messages.find((a) => a.id == actEl.id.slice("3"));

							const itsMeHi = message.author.id == discord.user.id;
							const isDM = guildID === "@me";
							const manage = channelPermissions?.manage_messages;

							const result = await $pushOptions([
								itsMeHi && !readOnly && { id: "edit", name: "Edit Message" },
								(isDM || manage) && !message.pinned && { id: "pin", name: "Pin Message" },
								(isDM || manage) && message.pinned && { id: "unpin", name: "Unpin Message" },
								!readOnly && { id: "reply", name: "Reply" },
								{ id: "speaknow", name: "Speak Message" },
								(itsMeHi || manage) && { id: "delete", name: "Delete Message" },
							]);

							function focusTextbox() {
								actEl = null;
								textbox?.focus();
							}

							switch (result) {
								case "speaknow":
									window.speechSynthesis?.speak(
										// use innerText instead of message.content, so that we don't need to do crap
										new SpeechSynthesisUtterance(actEl.querySelector(".content")?.innerText || "")
									);
									break;
								case "edit":
									editing = message;
									textbox.replaceText(message.content);
									focusTextbox();
									break;
								case "reply":
									replying = message;
									focusTextbox();
									break;
								case "delete":
									// to do confirm modal
									if ($settings.prompt_delete ? confirm("Are you sure you want to delete this message?") : 1) {
										discord.deleteMessage(channelID, message.id);
									}
									break;
								case "pin":
									discord.pinMessage(channelID, message.id);
									break;
								case "unpin":
									discord.unpinMessage(channelID, message.id);
									break;
								default:
									if (result) snackbar("NOT IMPLEMENTED!!!");
									break;
							}
						}
						actEl?.focus();
					}
					nav_busy = false;
				},
				"sn:navigatefailed": function (e) {
					if (nav_busy) return;
					const { direction } = e.detail;
					if (direction === "left") _back();
					if (!/up|down/.test(direction)) return;

					let actEl = document.activeElement;
					if (!actEl.id.startsWith("msg")) return;

					// const messages = actEl.closest("[data-messages]");
					if (!chatbox) return;

					if (actEl.offsetHeight > chatbox.offsetHeight) {
						chatbox.scrollBy({
							top: direction === "up" ? -66 : 66,
							behavior: !$settings.smooth_scroll || $longpress ? "auto" : "smooth",
						});
					}
					if (direction === "down" && chatbox.lastElementChild == actEl) {
						textbox?.focus();
					}
				},
				"sn:willunfocus": async function (e) {
					if (nav_busy) return;
					const { nextElement: next, direction } = e.detail;
					if (!/up|down/.test(direction)) return;

					const actEl = document.activeElement;
					if (!actEl.id.startsWith("msg")) return;
					if (!chatbox) return;

					const center = (el) => centerScroll(el, !$settings.smooth_scroll || $longpress);

					if (actEl.offsetHeight > chatbox.offsetHeight) {
						// console.warn("current message is bigger than screen, we scroll...");
						e.preventDefault();
						if (!inViewport(next))
							chatbox.scrollBy({
								top: direction === "up" ? -66 : 66,
								behavior: !$settings.smooth_scroll || $longpress ? "auto" : "smooth",
							});
						// if (!next) // console.warn("next element to focus not found!");
						if (!next) return;
						if (next.offsetHeight > chatbox.offsetHeight) {
							// console.warn("next element is bigger than viewport");
							if (inViewport(next, true)) {
								const { scrollTop } = chatbox;
								next.focus();
								chatbox.scrollTop = scrollTop;
							}
						} else if (inViewport(next)) {
							// console.warn("next element is not bigger than viewport and is in viewport right now");
							await center(next);
							next.focus();
						}
					} else if (next && next.offsetHeight < chatbox.offsetHeight) center(next);
				},
			},
			mounted
		)
	);

	function isActionMessage(type) {
		return [6, 7, 8, 3].includes(type);
	}

	function switchActionMessage(type) {
		return { 6: PinnedMessage, 8: BoostMessage, 3: CallMessage }[type];
	}

	function timeDif(...args) {
		const [dt2, dt1] = args.map((a) => new Date(a?.timestamp));
		var diff = (dt2 - dt1) / 1000;
		diff /= 60;
		return Math.abs(Math.round(diff)) > 0;
	}

	function decideDateSeparator(...args) {
		return new Set(args.map((a) => new Date(a?.timestamp).toLocaleDateString("en-us"))).size != 1;
	}

	function decideMessageSeparator(message, last_message, index) {
		if (
			decideDateSeparator(message, last_message) ||
			timeDif(last_message?.timestamp, message.timestamp) ||
			index == 0 ||
			last_message?.author.id != message.author?.id ||
			last_message?.type != message.type ||
			message.referenced_message ||
			message.interaction
		)
			return 1;
	}

	if (!PRODUCTION) {
		onDestroy(() => {
			navigate("/channels/@me", { replace: true });
		});
	}
</script>

<main>
	{#if loading || readOnly || ($_channel && channelName && showHeader) || !textbox || !chatbox}
		<div class:not_fixed={readOnly} class="header">
			<span>
				{#if loading}
					loading...
				{:else}
					{$_channel?.recipients ? "@" : "#"}
					{channelName}
				{/if}
			</span>
		</div>
	{/if}
	<div class="body">
		<div bind:this={chatbox} data-messages>
			{#if !loading}
				<div class="button-wrap">
					<Button
						on:keydown={function ({ key }) {
							if (key === "ArrowUp") this.click();
						}}
						onClick={async function e() {
							const { id } = $messages[0];
							const el = document.getElementById("msg" + id);
							const _ = await discord.getMessages(channelID, 8, id);
							if (!_.length) {
								el.focus();
								await delay(10);
								return "delete";
							}
							const inView = inViewport(this);
							$messages = _.reverse().concat($messages);

							if (inView) {
								await tick();
								await centerScroll(el, true);
								el.focus();
							}
						}}>Load More</Button
					>
				</div>
			{/if}
			{#each $messages as message, index (message.id)}
				{@const last_message = $messages[index - 1]}
				{#if index !== 0 && decideDateSeparator(message, last_message)}
					<DateSeparator
						>{new Date(message.timestamp).toLocaleDateString([], {
							month: "long",
							day: "numeric",
							year: "numeric",
						})}
					</DateSeparator>
				{/if}

				{@const type = message?.type}

				{#if isActionMessage(type)}
					{@const spread = { message, roles, guildID }}
					{#if type === 7}
						<JoinMessage {...spread} snowflake={new Date(message.timestamp) * 1} />
					{:else}
						<svelte:component this={switchActionMessage(type)} {...spread} />
					{/if}
				{:else}
					<Message
						{textbox}
						{chatbox}
						{channelID}
						{roles}
						pinged={wouldMessagePing(message, roles, discord.user.id)}
						bind:message
						replying={replying?.id == message.id ? replying : false}
						editing={editing?.id == message.id ? editing : false}
						{messages}
						{guildID}
					>
						{#if decideMessageSeparator(message, last_message, index)}
							<MessageSeparator {message} {roles} user={message.author} {guildID} />
						{/if}</Message
					>
				{/if}
			{/each}
			<!--
			{#if upload_progress !== null}
				<UploadProgress {upload_progress} {textbox} xhr={upload_xhr} />
			{/if}
			-->
		</div>
		{#if loading}
			<div class="loading">
				<div class="cubesLoading" />
			</div>
		{/if}
		<div class="frame">
			<div class="pills">
				<!-- add slowmode pill later -->
				{#if $files.length > 0}
					<div class="count">
						<span>{$files.length}</span>
						<Upload />
					</div>
				{/if}
			</div>
		</div>
	</div>
	<div class="footer">
		{#if $typingState.length > 0}
			<div class="typing">
				{#if $typingState.length < 4}
					{oxford($typingState, "and", "an error occured so no one")}
					{$typingState.length > 1 ? "are" : "is"} typing...
				{:else}
					Several people are typing...
				{/if}
			</div>
		{/if}
		{#if replying || editing}
			<div class="replying">
				{#if editing}
					Editing Message
				{:else}
					Replying to <b><Mentions {guildID} mentions={false} type="user" username={replying.author.username} id={replying.author.id} {roles} prefix={false} /></b>
				{/if}
			</div>
		{/if}
		{#if readOnly}
			<div class="readonly">You do not have permission to send messages in this channel.</div>
		{:else}
			<Textbox
				{roles}
				{channel}
				{guildID}
				{channelID}
				bind:value={textbox_text}
				bind:editing
				bind:replying
				bind:focused={textboxFocused}
				bind:showHeader
				{picker}
				{chatbox}
				bind:this={textbox}
			/>
			<div class="softkeys">
				<span>
					{#if textboxFocused && (textbox_text || $files.length > 0)}
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-send" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
							<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
							<line x1="10" y1="14" x2="21" y2="3"></line>
							<path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5"></path>
					 </svg>
					{:else if guildID === "@me"}
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-list-details" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
							<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
							<path d="M13 5h8"></path>
							<path d="M13 9h5"></path>
							<path d="M13 15h8"></path>
							<path d="M13 19h5"></path>
							<rect x="3" y="4" width="6" height="6" rx="1"></rect>
							<rect x="3" y="14" width="6" height="6" rx="1"></rect>
					 </svg>
					{:else}
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-list" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
							<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
							<line x1="9" y1="6" x2="20" y2="6"></line>
							<line x1="9" y1="12" x2="20" y2="12"></line>
							<line x1="9" y1="18" x2="20" y2="18"></line>
							<line x1="5" y1="6" x2="5" y2="6.01"></line>
							<line x1="5" y1="12" x2="5" y2="12.01"></line>
							<line x1="5" y1="18" x2="5" y2="18.01"></line>
					 </svg>
					{/if}
				</span>
				<span
					>{#if textboxFocused}
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-corner-down-left" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
						<path d="M18 6v6a3 3 0 0 1 -3 3h-10l4 -4m0 8l-4 -4"></path>
				 </svg>
					{/if}</span
				>
				<span
					>{#if textboxFocused && (editing || replying)}
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-x" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
						<circle cx="12" cy="12" r="9"></circle>
						<path d="M10 10l4 4m0 -4l-4 4"></path>
				 </svg>
					{:else}
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-dots-circle-horizontal" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
						<circle cx="12" cy="12" r="9"></circle>
						<line x1="8" y1="12" x2="8" y2="12.01"></line>
						<line x1="12" y1="12" x2="12" y2="12.01"></line>
						<line x1="16" y1="12" x2="16" y2="12.01"></line>
				 </svg>
					{/if}</span
				>
			</div>
		{/if}
	</div>
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	.button-wrap {
		width: 100%;
		display: flex;
		justify-content: center;
		padding: 3px 0;
	}
	main {
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
		position: fixed;
		top: 0;
		left: 0;
		@include linearGradient(35%, hsl(220, 7.7%, 22.9%));
		background-color: hsl(210, 3.4%, 11.4%);

		&,
		.header {
			border: 1px solid rgb(92, 92, 92);
		}

		:global {
			.mentions {
				background-color: var(--color, rgba(88, 101, 242, 0.3));
				border-radius: 2px;
				color: white;
				@include linearGradient(50%, rgba(255, 255, 255, 0.4));
				box-shadow: inset 0 0 0 1px rgba(230, 230, 230, 0.6);
				background-color: rgba(22, 65, 132, 0.6);
				padding: 0 2px;

				&.me {
					background: transparent !important;
					box-shadow: none !important;
					font-weight: bolder;
					color: rgba(229, 179, 52) !important;
				}
			}
			.emoji {
				position: relative;
				width: 16px;
				height: 16px;
				display: inline-block;

				span {
					font-size: 0;
					position: absolute;
				}

				&::before {
					content: "";
					position: absolute;
					background-image: var(--emoji_url);
					width: 16px;
					height: 16px;
					background-position: center;
					background-repeat: no-repeat;
					background-attachment: local;
					overflow: hidden;
					background-size: contain;
				}
			}
		}
	}

	.header {
		padding: 0 10px;
		height: 30px;
		font-size: 15px;
		font-weight: 600;
		vertical-align: center;
		display: flex;
		align-items: center;

		position: fixed;
		width: 100vw;
		top: 0;
		left: 0;
		z-index: 100;

		color: #ffffff;

		box-shadow: 0 0 5px 5px rgba(0, 0, 0, 0.4);
		@include linearGradient(5%, rgba(88, 88, 88));
		background-color: rgba(29, 29, 29);

		> span {
			height: 100%;
			width: 100%;
			line-height: 25px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		&.not_fixed {
			position: unset !important;
		}
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;

		.cubesLoading {
			width: 32px;
			height: 32px;
			position: relative;

			&::after,
			&::before {
				content: "";
				background-color: #7289da;
				width: 10px;
				height: 10px;
				position: absolute;
				top: 0;
				left: 0;
				animation: cubeSpinner 1.8s ease-in-out infinite;
			}

			&::after {
				animation-delay: -0.9s;
			}
		}

		@keyframes cubeSpinner {
			25% {
				transform: translateX(22px) rotate(-90deg) scale(0.5);
			}

			50% {
				transform: translateX(22px) translateY(22px) rotate(-180deg);
			}

			75% {
				transform: translateX(0) translateY(22px) rotate(-270deg) scale(0.5);
			}

			to {
				transform: rotate(-1turn);
			}
		}
	}

	[data-messages] {
		overflow: auto;
	}

	.body {
		position: relative;
		flex: 3;

		> * {
			position: absolute;
			width: 100%;
			height: 100%;
		}
	}

	.frame {
		overflow: hidden;
		pointer-events: none;
		display: flex;
		flex-direction: column;

		> .pills {
			margin-top: auto;
			font-size: 14px;
			width: 100%;
			display: flex;
			padding-right: 5px;
			padding-bottom: 4px;
			flex-direction: row-reverse;

			:global {
				svg {
					width: 16px;
					height: 16px;
				}
			}

			> * {
				height: 20px;
				padding: 2px 5px;
				display: flex;
				line-height: 15px;
				color: #dcddde;
				background-color: #2f3136;
				border-radius: 15px;
				margin-left: 2px;

				&.count {
					column-gap: 2px;
				}
			}
		}
	}

	.footer {
		border-top: 1px solid rgba(92, 92, 92);
		display: flex;
		flex-direction: column;
		background-image: url("/css/textbox_backdrop.png");
		box-shadow: inset 0 0 0 1px rgba(6, 6, 6, 0.5), 0 0 5px 5px rgba(0, 0, 0, 0.4);

		.typing {
			background-color: #2c2f32;
			font-size: 11px;
			line-height: 1.8;
			white-space: pre-wrap;
			word-break: break-word;
			padding: 0 8px;
		}

		.replying {
			color: rgb(185, 187, 190);
			font-size: 11px;
			margin-left: 9px;
			margin-top: 2px;
		}

		.readonly {
			font-size: 10px;
			padding: 3px 14px;
			color: #dcddde;
			border-top: solid 1px #2c2f32;
		}

		.softkeys {
			height: 22px;
			font-weight: 600;
			color: #b9bbbe;
			font-size: 12px;
			padding: 0 6px;
			display: flex;
			justify-content: space-between;
			align-items: center;

			> * {
				line-height: 1;
				width: 33.333333333333336%;
			}

			:nth-child(2) {
				font-weight: 800;
				font-size: 15px;
				text-align: center;
			}

			:last-child {
				text-align: end;
			}
		}
	}
</style>
