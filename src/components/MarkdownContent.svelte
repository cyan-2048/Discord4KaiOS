<script>
	import Markdown from "./Markdown.svelte";
	export let content = [],
		ref = null;
</script>

{#each content as item}
	<Markdown {ref} {...item} />
{/each}
