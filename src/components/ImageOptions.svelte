<script>
	import Options from "./Options.svelte";

	import { downloadFile } from "../lib/helper";
	import { tick } from "svelte";

	export let url;
	export let state;
	export let filename = "";

	let options;
</script>

<Options
	on:close={async () => {
		await tick();
		state = 0;
	}}
	bind:this={options}
>
	<div
		tabindex="0"
		on:click={async () => {
			await options.close();
			state = 2;
		}}
	>
		Zoom
		<svg data-name="Fullscreen" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
			<path fill="currentColor" d="M19,3H14V5h5v5h2V5A2,2,0,0,0,19,3Z" />
			<path fill="currentColor" d="M19,19H14v2h5a2,2,0,0,0,2-2V14H19Z" />
			<path fill="currentColor" d="M3,5v5H5V5h5V3H5A2,2,0,0,0,3,5Z" />
			<path fill="currentColor" d="M5,14H3v5a2,2,0,0,0,2,2h5V19H5Z" />
		</svg>
	</div>
	<div
		tabindex="0"
		on:click={() => {
			window.open(url, "_blank");
			options.close();
			state = 0;
		}}
	>
		Open Original
		<svg data-name="Launch" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M10 5V3H5.375C4.06519 3 3 4.06519 3 5.375V18.625C3 19.936 4.06519 21 5.375 21H18.625C19.936 21 21 19.936 21 18.625V14H19V19H5V5H10Z"
			/>
			<path
				fill="currentColor"
				d="M21 2.99902H14V4.99902H17.586L9.29297 13.292L10.707 14.706L19 6.41302V9.99902H21V2.99902Z"
			/>
		</svg>
	</div>
	<div
		tabindex="0"
		on:click={() => {
			downloadFile(url, filename).catch((e) => console.error(e));
			options.close().then(() => (state = 0));
		}}
	>
		Download
		<svg data-name="Download" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				fillrule="evenodd"
				cliprule="evenodd"
				d="M16.293 9.293L17.707 10.707L12 16.414L6.29297 10.707L7.70697 9.293L11 12.586V2H13V12.586L16.293 9.293ZM18 20V18H20V20C20 21.102 19.104 22 18 22H6C4.896 22 4 21.102 4 20V18H6V20H18Z"
			/>
		</svg>
	</div>
</Options>
