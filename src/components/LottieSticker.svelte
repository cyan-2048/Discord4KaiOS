<script>
	import { onMount } from "svelte";
	export let src;
	import lottie from "lottie-web/build/player/lottie_light.js";
	let container;
	onMount(() => {
		lottie.loadAnimation({
			container,
			renderer: "svg",
			loop: true,
			autoplay: true,
			path: src,
		});
	});
</script>

<div data-sticker bind:this={container} />

<style>
	div {
		width: 160px;
		height: 160px;
	}
</style>
