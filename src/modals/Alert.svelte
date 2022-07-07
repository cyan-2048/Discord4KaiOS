<script>
	import { onMount } from "svelte";

	import { hashCode } from "../lib/helper";
	import { sn } from "../lib/shared";
	import { decideSelected, handleBubble, handleButtons } from "./shared";

	export let args;
	export let callback;

	let main;

	let id = hashCode(String(Math.random()));
	let buttons = [{ text: "OK" }];
	let text = "";
	let selected = null;
	let align = "center";

	if (typeof args[0] === "string") {
		text = args[0];
	} else if (typeof args[0] === "object") {
		const opts = args[0];
		if (opts.buttons) {
			const final = [];
			if (typeof opts.buttons === "object")
				opts.buttons?.forEach((button) => {
					const type = typeof button;
					if (type === "string") {
						final.push({ text: button });
					} else if (type === "object" && button.text) final.push(button);
				});
			if (final.length !== 0) buttons = final;
		}
		if (opts.text) text = opts.text;
		if (opts.align) align = opts.align;
	}

	$: if (selected !== null)
		(async () => {
			if (typeof args[0] === "object") {
				callback(selected);
			} else {
				callback();
			}
		})();

	onMount(() => {
		const lastFocused = document.activeElement;
		handleButtons(id, buttons.length);
		if (buttons.length > 3) {
			main.querySelector("button").focus();
		} else main.focus();
		return () => {
			sn.remove(id + "-modals");
			lastFocused.focus();
		};
	});
</script>

<main
	bind:this={main}
	{id}
	on:keydown={function ({ key }) {
		const decided = decideSelected(key, buttons.length, align);
		if (decided !== null) selected = decided;
	}}
	on:keydown={handleBubble}
	on:keyup={handleBubble}
	tabindex="0"
	data-modal
>
	<div class="container">
		{#if text}
			<div class="text">
				{text}
			</div>
		{/if}

		<div
			style:justify-content={buttons.length === 1 && align === "center" ? "center" : "space-between"}
			class="button_container"
		>
			{#if buttons.length < 3 && align === "right"}
				<div />
			{/if}
			{#if buttons.length === 1 && align === "right"}
				<div />
			{/if}
			{#each buttons as button, i}
				<button on:click={() => (selected = i)}>{button.text}</button>
			{/each}
			{#if buttons.length < 3 && align === "left"}
				<div />
			{/if}
			{#if buttons.length === 1 && align === "left"}
				<div />
			{/if}
		</div>
	</div>
</main>

<style>
</style>
