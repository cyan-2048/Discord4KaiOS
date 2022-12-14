<script>
	import { onDestroy, onMount } from "svelte";
	export let src;
	import lottie from "lottie-web/build/player/lottie_light.js";
	import { xhr } from "../lib/helper";
	import { observeElement } from "../lib/shared";
	let container,
		url = null,
		lottieInstance = null,
		unsub = null;
	onMount(async () => {
		try {
			const blob = await xhr(src, { responseType: "blob" });
			url = URL.createObjectURL(blob);
			lottieInstance = lottie.loadAnimation({
				container,
				renderer: "svg",
				loop: true,
				autoplay: true,
				path: url,
			});
		} catch (e) {}
		// console.log(lottieInstance, lottie);
		lottie.setQuality("low");
		if (lottieInstance)
			unsub = observeElement(container).subscribe((value) => {
				lottieInstance[value ? "play" : "pause"]();
			});
	});
	onDestroy(() => {
		url && URL.revokeObjectURL(url);
		unsub?.();
		lottieInstance?.destroy();
	});
</script>

<div data-sticker bind:this={container} />

<style lang="scss">
	div {
		width: 160px;
		height: 160px;
	}
</style>
