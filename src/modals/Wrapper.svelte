<script>
	import { writable } from "svelte/store";
	import ImageViewer from "./ImageViewer.svelte";
	import Snackbar from "./Snackbar.svelte";

	export let snackbar_set = writable(new Set()),
		images = writable([]),
		images_callback = writable(() => {});
</script>

<main>
	<div class="snackbar_container">
		{#each [...$snackbar_set] as { text }}
			<Snackbar>{text}</Snackbar>
		{/each}
	</div>
</main>

{#if $images.length > 0}
	<ImageViewer images={$images} callback={$images_callback} />
{/if}

<style lang="scss">
	.snackbar_container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		width: 100%;
		position: fixed;
		bottom: 0;
	}

	main {
		position: fixed;
		pointer-events: none;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		z-index: 9999;
	}
</style>
