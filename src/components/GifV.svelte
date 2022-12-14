<script>
	import { onMount } from "svelte";
	import { observeElement } from "../lib/shared";

	export let embed, size;
	let image, src;

	onMount(() =>
		observeElement(image).subscribe((val) => {
			if (val) {
				//play
				src = embed.url + ".gif";
			} else {
				src = embed.thumbnail.proxy_url;
			}
		})
	);
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<img {...size} class="v-image" bind:this={image} {src} />

<!--
<video {...size} class="v-image" loop bind:this={video} src={embed.video.proxy_url} />
-->
