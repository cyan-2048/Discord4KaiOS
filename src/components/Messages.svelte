<script>
	// components
	import MessageOptions from "./MessageOptions.svelte";
	import ImageViewer from "../ImageViewer.svelte";
	let viewerSrc = null;

	// js imports
	import { onMount, tick as _tick } from "svelte";
	import { centerScroll, customDispatch, delay, last } from "../lib/helper";
	import { typingState, discord, evtForward, picker, sn } from "../lib/shared.js";
	import Options from "./Options.svelte";
	import { settings } from "../lib/stores";
	import Attachments from "../Attachments.svelte";
	import UploadProgress from "./UploadProgress.svelte";

	window.picker = picker;

	let files = [];
	picker.on("change", () => {
		({ files } = picker);
	});

	export let selected;
	export let appState;
	export let channelPermissions;
	export let sendMessage;
	export let messages;
	// export let roles;
	export let guildID;
	export let channel;
	export let chatbox = null;
	export let textbox = null;

	let after, after_height;

	let slowmode = null;

	function height() {
		const top = textbox.scrollTop,
			height = after.offsetHeight;

		if (top !== after.scrollTop) after.scrollTop = top;
		if (height !== after_height) after_height = height;
	}

	window.onresize = height;

	let currentTypingState = [];

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

	async function ontyping({ id, state }) {
		if (!channel || id !== channel.id) return;
		if (channel.dm) {
			currentTypingState = state.map((a) => channel.recipients.find((e) => e.id === a)?.username).filter((a) => !!a);
		} else {
			let current = [];
			if (state.length < 4) {
				for (const user of state) {
					if (user === discord.user.id) continue;
					let s_profile = await cachedMentions("getServerProfile", guildID, user);
					current.push(s_profile.nick || s_profile.user?.username || "unknown-user");
				}
			} else current = state;
			currentTypingState = current;
		}
		height();
	}

	$: channelPermissions && !PRODUCTION && console.log("channel permissions:", channelPermissions);
	$: if (selected === 1) {
		typingState.off("change", ontyping, "messages");
	} else if (selected === 0)
		_tick().then(() => {
			height();
			typingState.on("change", ontyping, "messages");
			ontyping(typingState.getState(channel.id));
		});

	let messageFocused = true;
	let enterFunc = null;

	onMount(() =>
		chatbox.addEventListener("focusin", (e) => {
			let { target } = e;
			if (target.id.startsWith("msg")) messageFocused = true;
			if (!messageFocused || selected !== 0 || appState !== "app") return;
			const f = (e) => !!target.querySelector(e);
			if (f(".v-image")) {
				enterFunc = "image";
			} else if (f("span.spoiler")) {
				enterFunc = f("span.spoiler.active") ? "unspoiler" : "spoiler";
			} else if (target.matches("[data-uploading]")) {
				enterFunc = "abortion";
			} else {
				enterFunc = null;
			}
		})
	);

	onMount(() =>
		chatbox.addEventListener("keydown", async ({ target, key }) => {
			if (!target.id.startsWith("msg")) return;
			const userMessage = target.classList.contains("userMessage");
			const manageMessage = channelPermissions.manage_messages === true;
			const binds = $settings.keybinds;
			switch (binds[key]) {
				case "edit":
					if (userMessage && !target.querySelector("[data-sticker]")) customDispatch(target, "edit");
					break;
				case "reply":
					if (channelPermissions.write !== false) customDispatch(target, "reply");
					break;
				case "jump":
					centerScroll(last(chatbox.children), !$settings.smooth_scroll);
					await delay(20);
					textbox.focus();
					break;
				case "delete":
					if (userMessage || manageMessage) customDispatch(target, "delete");
					break;
				case "pin":
					if (manageMessage || channel.dm) customDispatch(target, "pin");
					break;
			}
		})
	);

	window.addEventListener("sn:navigatefailed", (e) => {
		if (selected !== 0 || appState !== "app") return;
		let { direction } = e.detail;
	});

	let showQuery = false;
	let query_members = [];
	let query_roles = [];
	let query_emojis = [];
	let query_channels = [];

	let messageEditing = null;
	let messageReplying = null;

	$: if (selected !== 0) {
		if (messageReplying) {
			evtForward.emit("stop_replying:" + messageReplying.id);
			messageReplying = null;
		}
		if (messageEditing) {
			evtForward.emit("stop_editing:" + messageEditing.id);
			messageEditing = null;
		}
	}

	let upload_progress = null;
	let upload_xhr = null;

	onMount(height);
	onMount(() => {
		// let queryCache = {};
		let mentioned = [];

		async function clearForEdit(content = "") {
			textbox.value = content;
			textbox.oninput();
			height();
			await _tick();
			textbox.focus();
		}

		evtForward.on("message_edit", (message, content, mentions) => {
			if (messageReplying) {
				evtForward.emit("stop_replying:" + messageReplying.id);
				messageReplying = null;
			}
			evtForward.emit("stop_editing:" + messageEditing?.id);
			messageEditing = message;
			mentioned = mentions;
			clearForEdit(content);
		});
		evtForward.on("message_reply", (message) => {
			if (messageEditing) {
				evtForward.emit("stop_editing:" + messageEditing.id);
				messageEditing = null;
			}
			evtForward.emit("stop_replying:" + messageReplying?.id);
			messageReplying = message;
			clearForEdit();
		});

		const replaceMentions = (content) => {
			mentioned.forEach((a) => {
				if (typeof a !== "object") return;
				if (a.username) {
					let { discriminator: tag, username: name, id } = a;
					content = content.replace(`@${name}#${tag}`, `<@${id}>`);
				} else {
				}
			});
			mentioned = [];
			return content;
		};

		textbox.onkeydown = function ({ key }) {
			if (key === "SoftRight" && !messageEditing && !messageReplying) {
				showOptions1 = true;
				return;
			}
			if (key === "ArrowUp" && this.selectionStart === 0) setTimeout(() => last(chatbox.children)?.focus(), 50);
			setTimeout(async () => {
				if (!messageEditing && ("SoftLeft" === key || "End" === key) && (this.value !== "" || files.length > 0)) {
					if (this.value.startsWith("s/")) sendMessage.sed(this.value);
					else {
						if ((slowmode !== null && slowmode !== 0) || upload_progress !== null) return;
						// prettier-ignore
						const opts = messageReplying ? {message_reference:{ message_id: messageReplying.id, fail_if_not_exists: false }} : {}
						const promise = sendMessage(
							replaceMentions(this.value), // to do replace mention elements;
							opts,
							files.length > 0 ? files : null
						);

						if (files.length > 0) {
							upload_xhr = promise;
							promise.upload.onprogress = function (evt) {
								if (!evt.lengthComputable) return;
								upload_progress = (evt.loaded / evt.total) * 100;
							};
							const done = () => {
								upload_progress = null;
								upload_xhr = null;
							};
							promise.addEventListener("load", done);
							promise.addEventListener("error", done);
							promise.addEventListener("abort", done);
							picker.removeFile(-1);
						}

						let send = null;
						if (slowmode !== null) {
							if (files.length === 0) send = await promise;
							else {
								send = await new Promise((res) => {
									const xhr = promise;
									function done(text) {
										try {
											return JSON.parse(text);
										} catch (e) {
											return null;
										}
									}
									xhr.addEventListener("load", () => res(done(xhr.responseText)));
									xhr.addEventListener("error", () => res(null));
									xhr.addEventListener("abort", () => res(0));
								});
							}
						}

						if (send === 0) return;

						if (send) {
							slowmode = channel.rate_limit_per_user;
							if (slowmode) startTick();
							if (send.retry_after) {
								slowmode = Math.round(send.retry_after) + 1;
								startTick();
								return;
							}
						}
					}
					this.value = "";
					this.oninput();
				}
				if (messageEditing || messageReplying) {
					let end = () => {
						if (messageEditing) {
							evtForward.emit("stop_editing:" + messageEditing.id);
							messageEditing = null;
						} else {
							evtForward.emit("stop_replying:" + messageReplying.id);
							messageReplying = null;
						}
					};
					if ("SoftLeft" === key || "End" === key) {
						if (messageEditing) {
							discord.editMessage(channel.id, messageEditing.id, replaceMentions(this.value)); // to do replace mention elements
							this.value = "";
							this.oninput();
						}
						end();
					}
					if ("SoftRight" === key) {
						this.value = "";
						this.oninput();
						end();
					}
				}
				height();
			}, 50);
		};

		let query_timeout = null;

		function handleQuery() {
			clearTimeout(query_timeout);
			query_timeout = setTimeout(async () => {
				if (this.value.length !== this.selectionStart) return;
				let regex = /(#|@|:)\S*$/;
				if (!regex.test(this.value)) return;
				let copy = regex.exec(this.value)[0];
				let type = {
					"#": "channel",
					"@": "mention",
					":": "emoji",
				}[copy[0]];
				let query = copy.slice(1);
				if (query === "") return (showQuery = false);
				if (type === "mention") {
					query_members = await cachedMentions.getGuildMembers(query);
					// query_members.forEach((a) => {
					// 	queryCache[hashCode(a.guild_id + a.user.id)] = a;
					// });
					const insert = ({ user }) => {
						let { discriminator: tag, username: name } = user;
						this.value = this.value.replace(regex, `@${name}#${tag} `);
						this.oninput();
						this.selectionStart = this.value.length;
						showQuery = false;
						if (!mentioned.find((a) => a.id === user.id)) {
							mentioned = [...mentioned, user];
						}
					};
					if (query_members.length === 1) insert(query_members[0]);
					else if (query_members.length < 1) showQuery = false;
					else {
						console.error(query_members);
					}
				}
				if (!channel.dm)
					switch (type) {
						case "mention":
							break;
					}
			}, 1000);
		}

		let isTyping = false;

		textbox.onblur = () => (messageFocused = true);
		textbox.onfocus = () => {
			enterFunc = null;
			messageFocused = false;
		};
		textbox.oninput = function () {
			handleQuery.call(this);
			if (!isTyping) {
				isTyping = true;
				discord.xhrRequestJSON("POST", `channels/${channel.id}/typing`);
				setTimeout(() => (isTyping = false), 8000);
			}
			setTimeout(() => {
				after.innerText = this.value + " ";
				let _m = /(@(.*)#\d{4})|(:(\w*)(~\d{1,3})?:)/gi;
				if (_m.test(this.value)) after.innerHTML = after.innerHTML.replace(_m, `<span class="mentions">$&</span>`);
				height();
			}, 1);
		};
	});

	$: visibility = appState !== "app" ? "hidden" : null; // for some reason the scroll disappears when you use display none?
	$: readOnly = channelPermissions.write === false;
	$: s_readOnly = channelPermissions.write === false ? "none" : null;

	let showOptions = false;
	let showOptions1 = false;
	$: if (selected !== 0) {
		showOptions = showOptions1 = false;
	}
	let selectedMessage = null;
	let selectedElement = null;

	window.addEventListener("keydown", ({ key, target }) => {
		if (selected !== 0 || appState !== "app") return;
		if (
			!showOptions &&
			(key == "Backspace" || key == "ArrowLeft" || key == "SoftLeft") &&
			files.length === 0 &&
			(target.tagName !== "TEXTAREA" || target.value === "")
		) {
			setTimeout(() => (selected = 1), 50);
		}
		if (showOptions) return;
		if (!messageFocused) return;
		if (key === "Enter")
			switch (enterFunc) {
				case "image":
					const images = target.querySelectorAll("img.v-image");
					if (images.length === 1) {
						const {
							src,
							dataset: { url, width, height, filename },
						} = images[0];
						viewerSrc = {
							src,
							url: url || src,
							width: Number(width) || width,
							height: Number(height) || height,
							filename: filename || null,
						}; // to-do support multiple images
					}
					document.activeElement.blur();
					appState = "viewer";
					break;
				case "unspoiler":
				case "spoiler":
					target.querySelectorAll(".spoiler").forEach((el) => el.classList.toggle("active"));
					break;
				case "abortion":
					target.click();
					break;
			}
		if (key === "SoftRight") {
			customDispatch(target, "options");
		}
	});

	function resetSelected() {
		selectedElement = null;
		showOptions = false;
		selectedMessage = null;
	}

	evtForward.on("message_options", (message, el) => {
		resetSelected();
		selectedMessage = message;
		selectedElement = el;
		showOptions = true;
	});

	let tick = null;

	function startTick() {
		if (tick === null) {
			tick = setTimeout(function ticker() {
				if (slowmode < 1) return (tick = null);
				slowmode -= 1;
				setTimeout(ticker, 1000);
			}, 1000);
		}
	}

	$: if (channel && selected === 0) {
		if (channelPermissions.manage_messages !== true) {
			const rate = channel.rate_limit_per_user;
			const now = Date.now() / 1000;
			const find = last(messages.filter((a) => a.author.id === discord.user.id))?.timestamp;
			const lastMessage = find ? new Date(find) / 1000 : now;
			if (rate > 0) {
				const diff = Math.round(now - lastMessage);
				if (diff === 0 || diff > rate) slowmode = 0;
				else if (diff < rate) {
					slowmode = rate - diff;
				}
				startTick();
			} else {
				slowmode = null;
			}
		} else slowmode = null;
	}

	let options1;
</script>

{#if appState === "attachments"}
	<Attachments bind:appState {files} {picker} {textbox} />
{/if}
{#if showOptions}
	<MessageOptions
		on:close={resetSelected}
		{channel}
		el={selectedElement}
		message={selectedMessage}
		{channelPermissions}
	/>
{/if}
{#if appState === "viewer"}
	<ImageViewer bind:appState bind:view={viewerSrc} />
{/if}
{#if showOptions1}
	<Options
		bind:this={options1}
		on:close={async () => {
			showOptions1 = false;
			await delay(20);
			textbox.focus();
		}}
	>
		<div
			on:click={async () => {
				await options1.close();
				appState = "attachments";
			}}
		>
			Add Attachments
			<!-- prettier-ignore -->
			<svg xmlns=http://www.w3.org/2000/svg width=18 height=18 viewBox="0 0 24 24"><path fill=currentColor d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
		</div>
		<div>
			Settings
			<!-- prettier-ignore -->
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" fillrule="evenodd" cliprule="evenodd" d="M19.738 10H22V14H19.739C19.498 14.931 19.1 15.798 18.565 16.564L20 18L18 20L16.565 18.564C15.797 19.099 14.932 19.498 14 19.738V22H10V19.738C9.069 19.498 8.203 19.099 7.436 18.564L6 20L4 18L5.436 16.564C4.901 15.799 4.502 14.932 4.262 14H2V10H4.262C4.502 9.068 4.9 8.202 5.436 7.436L4 6L6 4L7.436 5.436C8.202 4.9 9.068 4.502 10 4.262V2H14V4.261C14.932 4.502 15.797 4.9 16.565 5.435L18 3.999L20 5.999L18.564 7.436C19.099 8.202 19.498 9.069 19.738 10ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"></path></svg>
		</div>
	</Options>
{/if}

<main class:zero={selected === 0} class:one={selected === 1} style:visibility>
	<div class="body">
		<div bind:this={chatbox} class:selected={selected === 0} data-messages>
			<slot />
			{#if upload_progress !== null}
				<UploadProgress {upload_progress} {textbox} xhr={upload_xhr} />
			{/if}
		</div>
		<div class="frame">
			<div class="pills">
				{#if slowmode !== null && !readOnly}
					<div class="count">
						<span>{slowmode}</span>
						<!-- prettier-ignore -->
						<svg width="16" height="16" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path fill="currentColor" fill-rule="nonzero"d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></g></svg>
					</div>
				{/if}
				{#if files.length > 0}
					<div class="count">
						<span>{files.length}</span>
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
					</div>
				{/if}
			</div>
		</div>
	</div>
	<div class="footer">
		{#if currentTypingState.length > 0}
			<div class="typing">
				{#if currentTypingState.length < 4}
					{oxford(currentTypingState, "and", "an error occured so no one")}
					{currentTypingState.length > 1 ? "are" : "is"} typing...
				{:else}
					Several people are typing...
				{/if}
			</div>
		{/if}
		{#if readOnly}
			<div class="readonly">You do not have permission to send messages in this channel.</div>
		{/if}
		<div style:display={s_readOnly} class="textbox">
			<textarea style:height={after_height + "px"} bind:this={textbox} rows="1" />
			<div bind:this={after} class="after" />
		</div>
		<div style:display={s_readOnly} class="softkeys">
			<div>
				{#if !messageEditing && !messageReplying && !messageFocused && (files.length > 0 || textbox.value !== "")}
					<!-- prettier-ignore -->
					<svg id="send" fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" ><path d="M0 0h24v24H0V0z" fill="none" /><path d="M3.4 20.4l17.45-7.48c.81-.35.81-1.49 0-1.84L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" /></svg >
				{:else if (messageEditing || messageReplying) && !messageFocused}
					<!-- prettier-ignore -->
					<svg id="checkmark" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fillrule="evenodd" cliprule="evenodd" d="M8.99991 16.17L4.82991 12L3.40991 13.41L8.99991 19L20.9999 7.00003L19.5899 5.59003L8.99991 16.17Z" /></svg>
				{:else}
					<!-- prettier-ignore -->
					<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" ><g fill="none"><path d="M0 0h24v24H0V0z" /><path d="M0 0h24v24H0V0z" opacity=".87" /></g><path d="M4 13c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0 4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm4 4h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zm0 4h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zM7 8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1zm-3 5c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0 4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm4 4h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zm0 4h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zM7 8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1z" /></svg >
				{/if}
			</div>
			<div>
				{#if !messageFocused}
					<!-- prettier-ignore -->
					<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" ><path d="M19 8v3H5.83l2.88-2.88c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L2.71 11.3c-.39.39-.39 1.02 0 1.41L7.3 17.3c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.83 13H20c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1s-1 .45-1 1z" /></svg >
				{/if}
			</div>
			<div>
				{#if !messageFocused && (messageEditing || messageReplying)}
					<!-- prettier-ignore -->
					<svg id="close" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" /></svg>
				{:else}
					<!-- prettier-ignore -->
					<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" ><path d="M0 0h24v24H0V0z" fill="none" /><path d="M4 18h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-5h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM3 7c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z" /></svg >
				{/if}
			</div>
		</div>
	</div>
</main>

<style>
	.pills {
		font-size: 14px;
		width: 100%;
		display: flex;
		padding-right: 5px;
		padding-bottom: 4px;
		flex-direction: row-reverse;
	}
	.pills > * {
		height: 20px;
		padding: 2px 5px;
		display: flex;
		line-height: 15px;
		color: rgb(220, 221, 222);
		background-color: #2f3136;
		border-radius: 15px;
		margin-left: 2px;
	}
	.pills > *.count {
		column-gap: 2px;
	}

	main {
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
		position: fixed;
		top: 0;
		left: 0;
		transform: translateX(100vw);
		transition: transform 0.4s ease;
		background-color: #36393f;
	}

	.one {
		transform: translateX(50vw);
	}
	.zero {
		transform: none;
	}

	.body {
		position: relative;
		flex: 3;
	}

	[data-messages] {
		overflow: auto;
	}

	.frame {
		overflow: hidden;
		pointer-events: none;
		display: flex;
		flex-direction: column;
	}
	.frame > .pills {
		margin-top: auto;
	}

	.typing {
		background-color: #2c2f32;
		font-size: 11px;
		line-height: 1.8;
		white-space: pre-wrap;
		word-break: break-word;
		padding: 0 8px;
	}

	.body > * {
		position: absolute;
		width: 100%;
		height: 100%;
	}
	.footer {
		display: flex;
		flex-direction: column;
	}

	.readonly {
		font-size: 12px;
		padding: 3px 14px;
	}

	.readonly,
	.textbox {
		border-top: solid 1px #2c2f32;
	}

	.textbox {
		position: relative;
		/* easy way to plop the elements on top of each other and have them both sized based on the tallest one's height */
		padding: 5px 10px;
	}
	.textbox .after {
		position: absolute;
		width: calc(100% - 20px) !important;
		top: 5px;
		/* Hidden from view, clicks, and screen readers */
		color: transparent !important;
		background-color: transparent !important;
		overflow: auto;
		pointer-events: none;
	}
	.textbox .after::after {
		content: " ";
	}
	.textbox > textarea {
		/* You could leave this, but after a user resizes, then it ruins the auto sizing */
		resize: none;

		/* Firefox shows scrollbar on growth, you can hide like this. */
		overflow: hidden;
	}
	.textbox > textarea,
	.textbox .after {
		/* Identical styling required!! */
		word-break: break-all; /* kaios behavior weird*/
		margin: 0;
		border: 1px solid rgb(118, 118, 118);
		border-radius: 5px;
		background-color: #40444b;
		color: #dcddde;
		padding: 4px 9px;
		font: inherit;
		max-height: 5em;
		font-size: 13px;
		line-height: 1.2;
		white-space: pre-wrap;
		width: 100%;
	}

	svg#send {
		margin: 2px 0;
		height: 18px;
	}
	.softkeys svg {
		height: 20px;
		border-radius: 20px;
		width: auto;
		padding: 0 5px;
		background-color: #2f3136;
	}

	/* Software Keys */

	.softkeys {
		width: 100vw;
		box-sizing: border-box;
		padding: 2px 5px;
		column-gap: 0;
		display: grid;
		height: 25px;
		color: white;
		grid-template-columns: repeat(3, 1fr);
	}

	.softkeys > * {
		overflow: hidden;
		vertical-align: middle;
	}

	.softkeys > *:not(:nth-child(2)) {
		font-size: 14px;
		font-weight: 600;
	}

	.softkeys > *:first-child {
		text-align: start;
	}

	.softkeys > *:nth-child(2) {
		font-size: 17px;
		font-weight: 700;
		text-align: center;
		text-transform: uppercase;
	}

	.softkeys > *:last-child {
		text-align: end;
	}
</style>
