<script>
	import { onMount } from "svelte";

	import Zoom from "svelte-zoom/src/index.svelte";
	import { back, delay } from "../lib/helper";

	export let images, callback;

	let zoom,
		index = 0,
		scaleValue,
		main;

	$: console.log("ScaleValue", scaleValue);

	$: image = images[index];

	onMount(() => {
		const _previous = document.activeElement;

		main.focus();

		return () => {
			_previous.focus();
		};
	});
</script>

<main
	class:pixelated={scaleValue >= 3}
	bind:this={main}
	tabindex="0"
	on:keydown={(e) => {
		const { key } = e;

		if (key === "Backspace") {
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
			callback();
			return;
		}

		if (!zoom) return;

		const { moveImage, zoomIn, zoomOut } = zoom;

		if (key == 3) zoomIn();
		if (key == 1) zoomOut();

		if (!key.startsWith("Arrow")) return;

		const offset = 50;

		switch (key.slice(5)) {
			case "Up":
				moveImage(0, offset);
				break;
			case "Down":
				moveImage(0, -offset);
				break;
			case "Left":
				moveImage(offset, 0);
				break;
			case "Right":
				moveImage(-offset, -0);
				break;
		}
	}}
>
	<Zoom bind:scaleValue bind:this={zoom} src={image.src} />
</main>

<style lang="scss">
	main {
		position: fixed;
		width: 100vw;
		height: 100vh;
		top: 0;
		left: 0;
		z-index: 999;
		background-color: rgba(0, 0, 0, 0.9);

		&.pixelated :global(img) {
			image-rendering: optimizeSpeed;
			image-rendering: pixelated;
		}
	}
</style>
