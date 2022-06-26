<script>
	/**
	 * USELESS
	 * NOT USED
	 * UNUSED
	 * SCRAPED
	 * CANNOT BE USED
	 * DISGUSTING
	 */
	import { onMount } from "svelte";
	import panzoom from "panzoom";
	export let src, state;

	let img;

	onMount(() => {
		const instance = panzoom(img, {
			bounds: true,
			minZoom: 1,
			boundsPadding: 1,
			initialZoom: 1.3,
		});

		function handleZoom(isZoomIn) {
			e.preventDefault();
			const { x, y } = instance.getTransform();
			let zoomBy = isZoomIn ? 2 : 0.5;
			instance.smoothZoom(x, y, zoomBy);
			// Or if you don't need animation, usee this:
			// pz.zoomTo(cx, cy, zoomBy);
		}

		instance.on("zoom", function (e) {
			console.log("Fired when `element` is zoomed", instance.getTransform());
		});

		let keydown_handler = ({ key }) => {
			if (key === "Backspace") state = 0;
			if (key === "SoftLeft") {
				handleZoom(false);
			}
			if (key === "SoftRight") {
				handleZoom(true);
			}
		};
		window.addEventListener("keydown", keydown_handler);
		return () => {
			instance.dispose();
			window.removeEventListener("keydown", keydown_handler);
		};
	});
</script>

<img {src} alt bind:this={img} />

<style>
</style>
