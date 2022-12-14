<script>
	import { onMount } from "svelte";
	import { observeElement } from "../lib/shared";

	export let name, id;

	let img,
		inView = false;

	onMount(() =>
		observeElement(img).subscribe((val) => {
			inView = val;
		})
	);
</script>

<img
	bind:this={img}
	data-sticker
	src="https://media.discordapp.net/stickers/{id}.png?size=160{inView ? '' : '&passthrough=false'}"
	width="160"
	height="160"
	alt="Sticker: {name}"
/>
