<script>
	import { onMount } from "svelte";
	import { last } from "../lib/helper";

	export let selected;
	export let appState;
	export let channelPermissions;
	export let sendMessage;

	let textarea, after, con, messages;
	let textAreaHeight = 0;

	window.addEventListener("sn:navigatefailed", (e) => {
		if (selected !== 0) return;
		let { direction } = e.detail;
	});

	let height = () => {
		textAreaHeight = window.innerHeight - con.offsetHeight;
	};

	$: {
		console.log(channelPermissions);
		setTimeout(() => con && height(), 50);
	}

	onMount(height);
	onMount(() => {
		textarea.onkeydown = function (e) {
			let { key } = e;
			if (key === "ArrowUp" && this.selectionStart === 0) setTimeout(() => last(messages.children)?.focus(), 50);
			if (/SoftLeft|-/.test(key)) {
				sendMessage(this.value); // to do replace mention elements
				setTimeout(() => (this.value = ""), 10);
			}
		};
		textarea.oninput = function () {
			setTimeout(() => {
				after.innerText = this.value + " ";
				let _m = /(@(\S*)#\d{4})|(:(\w*):)/g;
				if (_m.test(this.value)) after.innerHTML = after.innerHTML.replace(_m, `<span class="mentions">$&</span>`);
				after.scrollTop = textarea.scrollTop;
				height();
			}, 1);
		};
	});
</script>

<div
	bind:this={messages}
	data-messages
	style="{appState !== 'app' ? 'display:none;' : ''} height:{textAreaHeight}px;"
	class="{['zero', 'one'][selected] || ''} {selected === 0 ? 'selected' : ''}"
>
	<slot />
</div>
<div bind:this={con} class="grow-wrap {['zero', 'one'][selected] || ''}">
	<textarea style={channelPermissions.write === false ? "display:none;" : null} bind:this={textarea} />
	<div style={channelPermissions.write === false ? "display:none;" : null} bind:this={after} class="after" />
	{#if channelPermissions.write === false}
		<div style="font-size:10px">You do not have permission to send messages in this channel.</div>
	{/if}
</div>

<style>
	[data-messages] {
		position: absolute;
		top: 0;
		left: 0;
		overflow: auto;
	}
	[data-messages],
	.grow-wrap {
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
		bottom: 0;
		border-top: solid 1px #2c2f32;
		padding: 5px 10px;
	}
	.grow-wrap .after {
		/* This is how textarea text behaves */
		white-space: pre-wrap;
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
		word-break: break-word;
		border: 1px solid rgb(118, 118, 118);
		border-radius: 2px;
		background-color: #40444b;
		color: #dcddde;
		padding: 2px 9px;
		font: inherit;
		max-height: 5em;
		font-size: 12px;
		line-height: 1;
		grid-area: 1 / 1 / 2 / 2;
	}
</style>
