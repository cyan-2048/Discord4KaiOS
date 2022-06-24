<script>
	import { createEventDispatcher, onMount } from "svelte";
	import { last, hashCode } from "../lib/helper";
	import { typingState, discord, evtForward } from "../lib/shared.js";
	import { FilePickerInstance } from "../lib/FileHandlers.js";
	window.FilePickerInstance = FilePickerInstance;
	const picker = new FilePickerInstance();

	export let selected;
	export let appState;
	export let channelPermissions;
	export let sendMessage;
	// export let sn;
	// export let roles;
	export let guildID;
	export let channel;
	const dispatch = createEventDispatcher();

	let textarea, after, con, messages, softkeys, typing_indicator;
	let textAreaHeight = 0;
	let typingIndicatorBottom = 0;

	function height() {
		after.scrollTop = textarea.scrollTop;
		typingIndicatorBottom = con.offsetHeight + softkeys.offsetHeight;
		textAreaHeight = window.innerHeight - typingIndicatorBottom;
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
					let s_profile = await cachedMentions("getServerProfile", guildID, user);
					current.push(s_profile.nick || s_profile.user?.username || "unknown-user");
				}
			} else current = state;
			currentTypingState = current;
		}
		height();
	}

	$: channelPermissions && console.log("channel permissions:", channelPermissions);
	$: if (selected === 1) {
		typingState.off("change", ontyping, "messages");
	} else if (selected === 0) {
		setTimeout(height, 50);
		typingState.on("change", ontyping, "messages");
		ontyping(typingState.getState(channel.id));
	}

	let messageFocused = true;
	let enterFunc = null;

	window.addEventListener("sn:focused", (e) => {
		if (!messageFocused || selected !== 0 || appState !== "app") return;
		let { target } = e;
		const f = (e) => !!target.querySelector(e);
		if (f(".v-image")) {
			enterFunc = "image";
		} else if (f("span.spoiler")) {
			enterFunc = f("span.spoiler.active") ? "unspoiler" : "spoiler";
		} else {
			enterFunc = null;
		}
	});

	window.addEventListener("keydown", ({ key, target }) => {
		if (!messageFocused || selected !== 0 || appState !== "app") return;
		if (key === "Enter")
			switch (enterFunc) {
				case "image":
					{
						const images = target.querySelectorAll("img.v-image");
						if (images.length === 1) dispatch("v-image", { src: images[0].src }); // to-do support multiple images
					}
					break;
				case "unspoiler":
				case "spoiler":
					target.querySelectorAll(".spoiler").forEach((el) => el.classList.toggle("active"));
					break;
			}
	});

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

	onMount(height);
	onMount(() => {
		// let queryCache = {};
		let mentioned = [];

		evtForward.on("message_edit", (message, content, mentions) => {
			messageEditing = message;
			textarea.value = content;
			textarea.oninput();
			height();
			mentioned = mentions;
		});

		let replaceMentions = (content) => {
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

		textarea.onkeydown = function (e) {
			let { key } = e;
			if (key === "ArrowUp" && this.selectionStart === 0) setTimeout(() => last(messages.children)?.focus(), 50);
			setTimeout(() => {
				if (!messageEditing && ("SoftLeft" === key || "End" === key) && this.value !== "") {
					if (this.value.startsWith("s/")) sendMessage.sed(this.value);
					else sendMessage(replaceMentions(this.value)); // to do replace mention elements
					this.value = "";
					this.oninput();
				}
				if (messageEditing) {
					let end = () => (messageEditing = null);
					if ("SoftLeft" === key || "End" === key) {
						discord.editMessage(channel.id, messageEditing.id, replaceMentions(this.value)); // to do replace mention elements
						this.value = "";
						this.oninput();
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

		textarea.onblur = () => (messageFocused = true);
		textarea.onfocus = () => (messageFocused = false);
		textarea.oninput = function () {
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

	$: display = appState !== "app" ? "none" : null;
	$: readOnly = channelPermissions.write === false;
</script>

<div
	bind:this={messages}
	data-messages
	class={["zero", "one"][selected] || ""}
	style:display
	style:height={textAreaHeight - (typing_indicator?.offsetHeight || 0) + "px"}
	class:selected={selected === 0}
>
	<slot />
</div>
{#if currentTypingState.length > 0}
	<div bind:this={typing_indicator} style:bottom="{typingIndicatorBottom}px" id="typing">
		{#if currentTypingState.length < 4}
			{oxford(currentTypingState, "and", "an error occured so no one")}
			{currentTypingState.length > 1 ? "are" : "is"} typing...
		{:else}
			Several people are typing...
		{/if}
	</div>
{/if}
<div
	bind:this={con}
	style:bottom={readOnly ? 0 : null}
	style:display
	class="grow-wrap {['zero', 'one'][selected] || ''}"
>
	<textarea rows="1" style:display={readOnly ? "none" : null} bind:this={textarea} />
	<div style={readOnly ? "display:none;" : null} bind:this={after} class="after" />
	{#if readOnly}
		<div style="font-size: 10px; white-space: pre-wrap; word-wrap: break-word; height: 30px;">
			You do not have permission to send messages in this channel.
		</div>
	{/if}
</div>
<div
	bind:this={softkeys}
	class="softkeys {['zero', 'one'][selected] || ''}"
	style:display={readOnly || display ? "none" : null}
>
	<div>
		{#if !messageEditing && !messageFocused && (textarea?.value || "") !== ""}
			<svg id="send" fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"
				><path d="M0 0h24v24H0V0z" fill="none" /><path
					d="M3.4 20.4l17.45-7.48c.81-.35.81-1.49 0-1.84L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"
				/></svg
			>
		{:else if messageEditing && !messageFocused}
			<svg id="checkmark" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					fillrule="evenodd"
					cliprule="evenodd"
					d="M8.99991 16.17L4.82991 12L3.40991 13.41L8.99991 19L20.9999 7.00003L19.5899 5.59003L8.99991 16.17Z"
				/>
			</svg>
		{:else}
			<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"
				><g fill="none"><path d="M0 0h24v24H0V0z" /><path d="M0 0h24v24H0V0z" opacity=".87" /></g><path
					d="M4 13c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0 4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm4 4h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zm0 4h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zM7 8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1zm-3 5c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0 4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm4 4h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zm0 4h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1s.45 1 1 1zM7 8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1H8c-.55 0-1 .45-1 1z"
				/></svg
			>
		{/if}
	</div>
	<div>
		{#if !messageFocused}
			<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"
				><path
					d="M19 8v3H5.83l2.88-2.88c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L2.71 11.3c-.39.39-.39 1.02 0 1.41L7.3 17.3c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.83 13H20c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1s-1 .45-1 1z"
				/></svg
			>
		{/if}
	</div>
	<div>
		{#if !messageFocused && messageEditing}
			<svg id="close" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"
				/>
			</svg>
		{:else}
			<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"
				><path d="M0 0h24v24H0V0z" fill="none" /><path
					d="M4 18h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-5h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM3 7c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z"
				/></svg
			>
		{/if}
	</div>
</div>

<style>
	#typing {
		width: 100vw;
		position: absolute;
		left: 0;
		background-color: #2c2f32;
		font-size: 11px;
		line-height: 1.8;
		white-space: pre-wrap;
		word-break: break-word;
		padding: 0 8px;
	}

	svg#send {
		margin: 2px 0;
		height: 18px;
	}
	svg {
		height: 20px;
		border-radius: 20px;
		width: auto;
		padding: 0 5px;
		background-color: #2f3136;
	}
	[data-messages] {
		position: absolute;
		top: 0;
		left: 0;
		overflow: auto;
	}
	[data-messages],
	.grow-wrap,
	.softkeys,
	.softkeys-icon {
		width: 100vw;
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
	.grow-wrap {
		/* easy way to plop the elements on top of each other and have them both sized based on the tallest one's height */
		display: grid;
		position: absolute;
		bottom: 25px;
		border-top: solid 1px #2c2f32;
		padding: 5px 10px;
	}
	.grow-wrap .after {
		/* Hidden from view, clicks, and screen readers */
		color: transparent !important;
		background-color: transparent !important;
		overflow: auto;
		pointer-events: none;
	}
	.grow-wrap > textarea {
		/* You could leave this, but after a user resizes, then it ruins the auto sizing */
		resize: none;

		/* Firefox shows scrollbar on growth, you can hide like this. */
		overflow: hidden;
	}
	.grow-wrap > textarea,
	.grow-wrap .after {
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
		grid-area: 1 / 1 / 2 / 2;
		white-space: pre-wrap;
	}

	/* Software Keys */

	.softkeys {
		box-sizing: border-box;
		padding: 2px 5px;
		column-gap: 0;
		display: grid;
		height: 25px;
		color: white;
		grid-template-columns: repeat(3, 1fr);
		position: absolute;
		bottom: 0;
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
