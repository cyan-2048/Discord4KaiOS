<script>
	import ImageOptions from "./components/ImageOptions.svelte";
	import { createEventDispatcher, onMount } from "svelte";
	export let view;
	const { src, url } = view;
	const dispatch = createEventDispatcher();

	let img,
		main,
		state = 0,
		scale = 1,
		width = null,
		height = null;

	onMount(() => {
		let originalHeight = img.offsetHeight;
		let originalWidth = img.offsetWidth;

		function set() {
			originalHeight = img.offsetHeight;
			originalWidth = img.offsetWidth;
			height = originalHeight + "px";
			width = originalWidth + "px";
		}

		if (!img.complete) {
			img.onload = set;
		} else set();

		let keydown_handler = ({ key }) => {
			if (state === 0) {
				if (key === "Backspace") dispatch("close");
				if (key === "SoftLeft") {
				}
				if (key === "SoftRight") {
					state = 1;
				}
			}
			if (state === 2) {
				if (key.includes("Arrow")) {
					main.scrollBy(
						...{
							Left: [-66, 0],
							Right: [66, 0],
							Up: [0, -66],
							Down: [0, 66],
						}[key.replace("Arrow", "")]
					);
				} else {
					if (key === "SoftLeft" && scale !== 1) {
						scale -= 0.5;
					}
					if (key === "SoftRight" && scale !== 5) {
						scale += 0.5;
					}
					height = originalHeight * scale + "px";
					width = originalWidth * scale + "px";
					if (key === "Backspace") {
						height = originalHeight + "px";
						width = originalWidth + "px";
						state = 0;
					}
				}
			}
		};
		window.addEventListener("keydown", keydown_handler);
		return () => {
			window.removeEventListener("keydown", keydown_handler);
		};
	});
</script>

<main bind:this={main}>
	<img
		style:max-height={state === 2 ? "unset" : null}
		style:max-width={state === 2 ? "unset" : null}
		style:width
		style:height
		bind:this={img}
		{src}
		alt
	/>
	{#if state === 1}
		<ImageOptions bind:state {url} />
	{/if}
</main>

<style>
	img {
		display: block;
		image-rendering: pixelated;
		image-rendering: optimizeSpeed;
		max-width: 100vw;
		max-height: 100vh;
	}
	main {
		position: absolute;
		height: 100vh;
		width: 100vw;
		top: 0;
		left: 0;
		display: grid;
		place-items: center;
		overflow: hidden;
	}
</style>
