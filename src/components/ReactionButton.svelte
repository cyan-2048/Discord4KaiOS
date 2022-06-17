<script>
	export let emoji;
	export let me;
	export let count;
</script>

{#if count > 0}
	<main class:me>
		{#if emoji.id}
		<div class="non_uni" >
      <img src='https://cdn.discordapp.com/emojis/{emoji.id}.{emoji.animated ? "gif" : "png"}?size=16' alt={emoji.name} />
    </div>	
    {:else}
			<div class="unicode">{emoji.name}</div>
		{/if}
		<div class="num">{count}</div>
	</main>
{/if}

<style>
	main.me {
		border-color: rgb(88, 101, 242);
		background-color: rgba(88, 101, 242, 0.15);
	}
  img {
    width: 12px;
  }
	main {
		height: 20px;
		border-radius: 8px;
		border: solid 1px;
		--b: #2f3136;
		display: inline-flex;
		font-size: 12px;
		align-items: center;
		padding: 0 3px;
		margin-right: 2px;
		margin-bottom: 2px;
	}
	main:not(.me) {
		border-color: var(--b);
		background-color: var(--b);
	}
  .num {
    margin-left: 2px;
  }
</style>
