<script>
	export let avatar = null;
	export let mentions = 0;
	export let unread = false;
	export let muted = false;
	export let subtext = null;
	export let status = null;
	export let ch_type = "text";

	window.onkeydown = (e) => mentions++;
</script>

<main tabindex="0" class="{avatar ? 'dm' : ''} {muted && mentions == 0 ? 'muted' : ''} {((unread && !muted) || mentions) > 0 ? 'unread' : ''}">
	{#if avatar}
		<div class="avatar">
			<img src={avatar} alt="" />
			{#if status}
				<div class="status" style="background-image:url(/css/status/{status}.png);" />
			{/if}
		</div>
	{:else}
		<img class="ch_type{mentions > 0 || unread ? ' bright' : ''}" src="/css/channels/{ch_type}.png" alt />
	{/if}
	{#if !isNaN(mentions) && mentions > 0}
		<div class="mentions">
			<div class={String(mentions).length > 2 ? "flow" : ""}>{mentions}</div>
		</div>
	{/if}
	{#if subtext}
		<div class="subtext">{subtext}</div>
	{/if}
	<div class="text"><slot /></div>
</main>

<style>
	main:last-child {
		margin-bottom: 6.5px;
	}
	img {
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: optimizespeed;
	}
	.mentions,
	.subtext,
	.text,
	.avatar,
	.status,
	.ch_type {
		position: absolute;
	}
	.bright {
		filter: brightness(2);
	}
	.status {
		background-size: 11px;
		background-repeat: no-repeat;
		background-position: 2.9px;
		width: 16px;
		height: 16px;
		border-radius: 100%;
		bottom: 5px;
		right: 0;
		background-color: #2f3136;
	}

	.ch_type {
		width: 20px;
		height: 100%;
		object-fit: contain;
		left: 6px;
	}

	.avatar {
		top: 5px;
		left: 5px;
	}

	.avatar img {
		width: 32px;
		height: 32px;
		border-radius: 100%;
		object-fit: contain;
	}
	.mentions {
		width: fit-content;
		min-width: 16px;
		height: 100%;
		right: 10px;
		display: grid;
		place-items: center;
	}

	.flow {
		padding: 0 3px;
	}
	.subtext {
		bottom: 6px;
		left: 50px;
		font-size: 11px;
	}
	.subtext + .text {
		top: 3px !important;
	}
	.mentions > div {
		display: block;
		width: fit-content;
		min-width: 16px;
		height: 16px;
		background-color: #ed4245;
		border-radius: 8px;
		font-size: 10px;
		text-align: center;
		color: white;
	}

	main {
		width: calc(100vw - 20px);
		margin-left: 10px;
		border-radius: 5px;
		position: relative;
		margin-bottom: 2px;
		height: 32px;
	}

	.text {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	main:not(.dm) .text {
		left: 32px;
		font-size: 14px;
		top: 0;
		height: 100%;
		vertical-align: middle;
		width: calc(100vw - 6rem);
		line-height: 32px;
	}

	.dm {
		height: 42px !important;
	}
	.dm .text {
		font-size: 15px;
		top: 10.5px;
		left: 50px;
		width: calc(100vw - 80px);
	}
	main > * {
		color: #72767d;
	}
	:focus > *,
	.unread > * {
		color: white !important;
	}
	.muted {
		opacity: 0.7;
	}
	.muted > * {
		color: #4f545c;
	}
	.muted:focus {
		opacity: 1;
	}
	main:focus,
	main:focus .status {
		background-color: #393c42;
	}
</style>
