<script>
	import { discord } from "../lib/database";
	import Mentions from "./Mentions.svelte";

	const queryTitles = ["MEMBERS", "CHANNELS", "EMOJIS"];

	export let bottom = null,
		title = 0,
		query,
		guildID,
		roles,
		queryText;

	let selected = null;

	export function focus() {
		move(-1);
	}

	export function blur() {
		selected = null;
	}

	export function select() {
		return selected;
	}

	export function move(i) {
		if (!query) return;
		if (i > 0) {
			if (selected + 1 == query.length) {
				blur();
			} else selected = Math.min(selected + 1, query.length - 1);
		} else {
			if (selected === null) {
				selected = query.length - 1;
			} else selected = Math.max(selected - 1, 0);
		}
	}

	$: if (query && selected > query.length - 1) {
		selected = query.length - 1;
	}
	$: if (query === null) selected = null;
</script>

<main style:bottom>
	<header>{queryTitles[title]} MATCHING <span style:font-weight="600" style:color="white">{queryText}</span></header>
	<ul>
		{#each query as item, i (item?.id || item)}
			{#if item.user || item.username}
				{@const { username, id, avatar } = item.user || item}
				<li class:selected={i === selected}>
					<img alt={username} src={discord.getAvatarURL(id, avatar)} class="icon" />
					<div class="text"><Mentions {guildID} mentions={false} type="user" {username} {id} {roles} prefix={false} /></div>
				</li>
			{:else}
				<li class:selected={i === selected}>
					<div class="icon">#</div>
					<div class="text">{item.username || item.nick || item.user?.username || item.name}</div>
				</li>
			{/if}
		{/each}
	</ul>
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	main {
		/*! margin: 10px; */
		background: linear-gradient(to bottom, #404244, #212325);
		border-radius: 8px;
		overflow: hidden;
		position: fixed;
		max-height: 222px;
		bottom: 60px;
		width: calc(100vw - 10px);
		left: 5px;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset -1px 0 0 rgba(255, 255, 255, 0.1), inset 1px 0 0 rgba(255, 255, 255, 0.1),
			inset 0 -1px 0 rgba(255, 255, 255, 0.2);

		> header {
			margin: 0;
			padding: 0 10px;
			box-sizing: border-box;
			height: 28px;
			line-height: 32px;
			font-size: 13px;
			font-weight: bold;
			color: #a6a6a6;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> ul {
			margin: 0 0 8px;
			padding: 0 8px;
			box-sizing: border-box;
			list-style: none;

			> li {
				padding: 0 5px;
				box-sizing: border-box;
				height: 30px;
				line-height: 30px;
				font-size: 13px;
				color: #e7e7e7;
				border-radius: 5px;
				width: 100%;
				/* helps center the text in the y-axis */
				display: inline-flex;
				align-items: center;

				.text {
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					font-weight: 600;
				}

				&:hover,
				&:focus,
				&.selected {
					@extend %focus;
				}

				&:active {
					background: rgba(0, 0, 0, 0.1);
					box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
				}

				img.icon {
					border-radius: 3px;
					border: 1px solid rgba(0, 0, 0, 0.4);
					box-shadow: 0 0 0 1px rgba(230, 230, 230, 0.6), 0 0 3px 3px rgba(0, 0, 0, 0.4);
				}

				.icon {
					width: 22px;
					height: 22px;
					background: #000;
					margin: 0;
					border-radius: 5px;
					border: 0;
					box-sizing: border-box;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
					margin-inline-end: 8px;
					overflow: hidden;
				}
			}
		}
	}
</style>
