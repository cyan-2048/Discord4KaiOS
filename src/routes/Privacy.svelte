<script>
	import { tick } from "svelte";
	import { showAds } from "./stores";
</script>

<svelte:window
	on:keydown={async ({ key }) => {
		if (key === "Backspace") {
			await tick();
			history.back();
		}
	}}
/>

<main>
	<div class="title">Privacy Policy</div>
	<div class="content">
		Discord4KaiOS does not collect data whatsoever... This app uses Discord's API, and it is probably collecting data
		and that's not my problem.
	</div>
	<div class="content">
		However, a few privacy things are not implemented in this app because of the limitations of KaiOS.
	</div>
	<div class="content">
		Discord creates a proxy for gifs called "GifV". It converts gifs to videos. However, on KaiOS devices gifv is very
		slow. To make messages that contain gifs work, Discord4KaiOS will directly embed the gif images from the gif
		provider (Ex. tenor). When debugging the app on desktop, a third party CORS proxy will be used to substitute KaiOS'
		systemXHR permission.
	</div>
	{#if $showAds}
		<div class="content">
			KaiAds are required for the app to be uploaded to the KaiStore. It is only present in the About page. The banner
			ad is sandboxed in a cross-origin iframe, therefore it cannot access the app's data. The sandbox also means it
			only connects to KaiOStech servers when you go to the page. To get rid of KaiAds, consider installing the app
			without using the KaiStore.
		</div>
	{/if}
</main>

<style lang="scss">
	@forward "../assets/shared";
	main {
		height: 100%;
		overflow: auto;
		@extend %layer1;
		padding: 6px 6px;

		.title {
			font-size: 17px;
			font-weight: 600;
			padding: 0 6px;
		}

		.content {
			padding: 4px 6px;
			font-size: 14px;
		}
	}
</style>
