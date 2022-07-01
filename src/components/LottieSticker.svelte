<script>
	import { onDestroy, onMount } from "svelte";
	export let src;
	import lottie from "lottie-web/build/player/lottie_light.js";
	import { xhr } from "../lib/helper";
	let container,
		url = null;
	onMount(async () => {
		try {
			const blob = await xhr(src, { responseType: "blob" });
			url = URL.createObjectURL(blob);
			lottie.loadAnimation({
				container,
				renderer: "svg",
				loop: true,
				autoplay: true,
				path: url,
			});
		} catch (e) {}
	});
	onDestroy(() => {
		if (url) URL.revokeObjectURL(url);
	});
</script>

<div data-sticker bind:this={container} />

<style>
	div {
		width: 160px;
		height: 160px;
	}
</style>
