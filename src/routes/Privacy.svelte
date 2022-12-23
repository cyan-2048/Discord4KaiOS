<script>
	import { onMount, tick } from "svelte";
  import { centerScroll } from "../lib/helper";
  import { sn } from "../lib/shared";
	import { showAds } from "./stores";

	onMount(()=>{
		const id = Math.random().toString(32);

		sn.add(id, { selector: "#Privacy_page [tabindex]" });
		sn.focus(id);

		return () => {
			sn.remove(id);
		};
	})
</script>

<svelte:window
	on:keydown={async ({ key }) => {
		if (key === "Backspace") {
			await tick();
			history.back();
		}
	}}
/>

<main id="Privacy_page" on:focus|capture={({ target }) => centerScroll(target)}>
	<div class="title">Privacy Policy</div>
	<div tabindex="0" class="content">
		Discord4KaiOS does not collect data whatsoever... This app uses Discord's API, and it is probably collecting data
		and that's not my problem.
	</div>
	<div tabindex="0" class="content">
		However, a few privacy things are not implemented in this app because of the limitations of KaiOS.
	</div>
	<div tabindex="0" class="content">
		Discord creates a proxy for gifs called "GifV". It converts gifs to videos. However, on KaiOS devices gifv is very
		slow. To make messages that contain gifs work, Discord4KaiOS will directly embed the gif images from the gif
		<!-- svelte-ignore missing-declaration -->
		provider (Ex. tenor). {#if !PRODUCTION}When debugging the app on desktop, a third party CORS proxy will be used to substitute KaiOS' systemXHR permission.{/if}
	</div>
	{#if $showAds}
		<div tabindex="0" class="content">
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
