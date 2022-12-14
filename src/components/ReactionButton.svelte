<script>
	import { discord } from "../lib/database";

	export let reaction, channelID, message;

	let emoji, me, count;

	$: reaction && ({ emoji, me, count } = reaction);
</script>

{#if count > 0}
	<main
		on:click={async () => {
			discord.reaction(me ? "DELETE" : "PUT", channelID, message?.id, emoji);
		}}
		class:me
	>
		{#if emoji.id}
			<div class="non_uni">
				<img
					src="https://cdn.discordapp.com/emojis/{emoji.id}.{emoji.animated ? 'gif' : 'png'}?size=16"
					alt={emoji.name}
				/>
			</div>
		{:else}
			<div class="unicode">{emoji.name}</div>
		{/if}
		<div class="num">{count}</div>
	</main>
{/if}

<style lang="scss">
	main {
		height: 20px;
		border: solid 1px;
		display: flex;
		font-size: 12px;
		align-items: center;
		padding: 0 3px;
		margin-right: 2px;
		margin-bottom: 2px;

		--b: rgba(20, 20, 20, 0.5) !important;
		border-radius: 4px;
		box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(230, 230, 230, 0.2) !important;

		&.me {
			border-color: #5865f2;
			background-color: rgba(88, 101, 242, 0.15);
		}

		&:not(.me) {
			border-color: var(--b);
			background-color: var(--b);
		}

		.non_uni {
			display: flex;
			align-items: center;
		}

		img {
			width: 12px;
			height: 12px;
			object-fit: contain;
		}

		.num {
			margin-left: 2px;
		}
	}
</style>
