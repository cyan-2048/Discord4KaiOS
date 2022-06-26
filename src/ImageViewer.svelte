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
		height = null,
		opacity = 1;

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

		let opacityTimeout = null;

		let keydown_handler = ({ key }) => {
			clearTimeout(opacityTimeout);
			opacity = 1;
			opacityTimeout = setTimeout(() => {
				opacity = 0;
			}, 4000);
			if (state === 0) {
				if (key === "Backspace" || key === "SoftLeft") dispatch("close");
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
	<footer style:opacity>
		{#if state !== 2}
			<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"
				><title>Arrow Back</title><path
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="48"
					d="M244 400L100 256l144-144M120 256h292"
				/></svg
			>
			<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"
				><title>Menu</title><path
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-miterlimit="10"
					stroke-width="32"
					d="M80 160h352M80 256h352M80 352h352"
				/></svg
			>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill="currentColor"
				class="bi bi-zoom-out"
				viewBox="0 0 16 16"
			>
				<path
					fill-rule="evenodd"
					d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"
				/>
				<path
					d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"
				/>
				<path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
			</svg>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill="currentColor"
				class="bi bi-zoom-in"
				viewBox="0 0 16 16"
			>
				<path
					fill-rule="evenodd"
					d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"
				/>
				<path
					d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"
				/>
				<path
					fill-rule="evenodd"
					d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"
				/>
			</svg>
		{/if}
	</footer>
</main>

<style>
	footer {
		transition: opacity 0.3s ease-in-out;
		position: fixed;
		height: 30px;
		width: 100vw;
		bottom: 0;
		background-color: rgba(47, 49, 54, 0.3);
		padding: 3px 5px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
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
