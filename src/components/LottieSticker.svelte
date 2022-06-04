<script>
	import { onMount } from "svelte";
	export let src;
	import bodymovin from "../lib/lottie_light.js";
	let container;
	onMount(() => {
		var animation = bodymovin.loadAnimation({
			container,
			renderer: "svg",
			loop: true,
			autoplay: true,
			path: src,
		});
	});
</script>

<div bind:this={container} />

<style>
	div {
		width: 160px;
		height: 160px;
	}
</style>
