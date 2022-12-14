<script>
	import { onDestroy, onMount } from "svelte";
	import { centerScroll, delay } from "../lib/helper";
	import { longpress, settings } from "../lib/shared";

	export let upload_progress, textbox, xhr;

	let main;
	onMount(() => {
		centerScroll(main, !$settings.smooth_scroll || $longpress);
	});
	onDestroy(async () => {
		if (main === document.activeElement) {
			await delay(50);
			textbox.focus();
		}
	});
</script>

<main data-uploading on:click={() => xhr.abort()} bind:this={main} data-focusable tabindex="0">
	<div class="container">
		<div class="body">
			<div class="text">
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="1 2 22 22"
					><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" /></svg
				>
				<div class="text1">
					<span>Uploading...</span>
					<span>
						{Math.round(upload_progress)}%
					</span>
				</div>
			</div>
			<div class="progress" style:--p="{upload_progress}%" style:color={upload_progress === 100 ? "#399757" : null} />
		</div>
		<svg class="abort_upload" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
			><path
				fill="currentColor"
				d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"
			/></svg
		>
	</div>
</main>

<style lang="scss">
	.abort_upload {
		margin-left: 4px;
	}
	.text {
		align-items: center;
		padding-bottom: 2px;
	}
	.text1 {
		flex: 3;
		justify-content: space-between;
		font-size: 12px;
	}
	.progress:after {
		content: "";
		display: block;
		width: var(--p, 0);
		height: 100%;
		background-color: currentColor;
	}
	.progress {
		height: 2px;
		color: #535edb;
		background-color: #4b4f57;
		margin-bottom: 1px;
	}
	.container,
	.body,
	.text,
	.text1 {
		display: flex;
	}
	.container {
		height: 100%;
		background-color: #313339;
		padding: 0 5px;
		align-items: center;
	}
	.body {
		flex: 2;
		flex-direction: column;
	}
	main {
		padding: 5px;
		height: 36px;
	}
	main:focus {
		background-color: #32353b;
	}
</style>
