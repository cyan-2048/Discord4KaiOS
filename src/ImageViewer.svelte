<script>
	import { createEventDispatcher, onMount } from "svelte";
	export let src;
	const dispatch = createEventDispatcher();
	let img;
	let ratio = {};
	onMount(() => {
		let _ratio = {};
		img.onload = () => {
			const { naturalHeight: srcHeight, naturalWidth: srcWidth } = img;
			const c_ratio = Math.min(window.innerWidth / srcWidth, window.innerHeight / srcHeight);
			ratio = { width: srcWidth * c_ratio, height: srcHeight * c_ratio };
			_ratio = { ...ratio };
		};

		function zoomIn() {
			if (ratio.height > _ratio.height * 5) return;
			ratio.height += _ratio.height / 5;
			ratio.width += _ratio.width / 5;
		}

		function zoomOut() {
			if (ratio.width <= _ratio.width) return;
			ratio.height -= _ratio.height / 5;
			ratio.width -= _ratio.width / 5;
		}

		let keydown_handler = ({ key }) => {
			if (key === "Backspace") dispatch("close");
			if (key === "SoftLeft") zoomOut();
			if (key === "SoftRight") zoomIn();
		};
		window.addEventListener("keydown", keydown_handler);
		return () => {
			window.removeEventListener("keydown", keydown_handler);
		};
	});
</script>

<main>
	<img bind:this={img} {...ratio} {src} alt={JSON.stringify($$props)} />
</main>

<style>
	img {
		image-rendering: pixelated;
		image-rendering: optimizeSpeed;
	}	main {
		position: absolute;
		height: 100vh;
		width: 100vw;
		top: 0;
		left: 0;
		display: grid;
		place-items: center;
	}
</style>
