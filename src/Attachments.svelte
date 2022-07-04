<script>
	import { afterUpdate, onMount } from "svelte";
	import { customDispatch, delay } from "./lib/helper";
	import { sn } from "./lib/shared";

	export let files, picker, appState, textbox;
	let main;

	onMount(() => {
		const id = "attachments";
		sn.add({
			id,
			selector: "[data-attachments] [data-focusable]",
			restrict: "self-only",
		});
		sn.focus(id);
		const onkeydown = async ({ key, target }) => {
			switch (key) {
				case "Backspace":
					await delay(50);
					appState = "app";
					break;
				case "SoftLeft":
					picker.addFile();
					break;
				case "SoftRight":
					customDispatch(target, "delete");
					break;
			}
		};
		window.addEventListener("keydown", onkeydown);

		return async () => {
			sn.remove(id);
			window.removeEventListener("keydown", onkeydown);
			await delay(50);
			textbox.focus();
		};
	});

	afterUpdate(() => {
		sn.focus("attachments");
	});
</script>

<main data-attachments bind:this={main} tabindex="0">
	<div class="body">
		{#each files as file, i}
			<div on:delete={() => picker.removeFile(i)} data-focusable tabindex="0">
				<span>{file.name || "unknown name"}</span>
			</div>
		{:else}
			<div>No Files to Upload</div>
		{/each}
	</div>
	<!-- prettier-ignore -->
	<footer>
		<svg on:click={() => picker.addFile()} width="24" height="24" viewBox="0 0 24 24"><path class="attachButtonPlus-3IYelE" fill="currentColor" d="M12 2.00098C6.486 2.00098 2 6.48698 2 12.001C2 17.515 6.486 22.001 12 22.001C17.514 22.001 22 17.515 22 12.001C22 6.48698 17.514 2.00098 12 2.00098ZM17 13.001H13V17.001H11V13.001H7V11.001H11V7.00098H13V11.001H17V13.001Z"></path></svg>
    <svg style:opacity={files.length === 0 ? "0.5": null} style:color="rgb(237, 66, 69)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z"></path><path fill="currentColor" d="M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z"></path></svg>
	</footer>
</main>

<style>
	footer {
		padding: 3px 5px;
		display: flex;
		justify-content: space-between;
		background-color: #2f3136;
	}
	main {
		height: 100vh;
		width: 100vw;
		background-color: #18191c;
		display: flex;
		flex-direction: column;
	}
	.body {
		padding: 8px;
		flex: 2;
		overflow: auto;
	}
	.body > div,
	footer {
		color: rgb(185, 187, 190);
	}
	.body > div {
		height: 32px;
		font-size: 14px;
		font-weight: 600;
		user-select: none;
		border-radius: 3px;
		line-height: 18px;
		padding: 7px 7px;
		display: flex;
		justify-content: space-between;
	}
	.body > div:focus {
		background-color: #4752c4;
		color: white !important;
	}
	.body > div > span {
		width: 100%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	footer {
		height: 30px;
	}
</style>
