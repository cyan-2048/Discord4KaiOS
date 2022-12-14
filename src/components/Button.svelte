<script>
	import { createEventDispatcher } from "svelte";
	import { settings } from "../lib/shared";
	export let onClick = () => Promise.resolve(true);
	let dispatch = createEventDispatcher();
	let state = 0,
		button;
	let changeOfState = async (...args) => {
		if (state === 1) return;
		state = 1;

		let result;
		try {
			result = await onClick.call(button, ...args);
			dispatch("success", result);
		} catch (error) {
			$settings.debug && console.error(error);
			dispatch("error", error);
		}
		state = 0;
		if (result === "delete") state = null;
	};
</script>

{#if state !== null}
	<button
		bind:this={button}
		class="Button"
		{...$$props}
		tabindex="0"
		data-focusable
		on:focus
		on:keydown
		on:click={changeOfState}
	>
		{#if !state}
			<slot />
		{:else}
			<div class="dot-wrap">
				<div class="dot-flashing" />
			</div>
		{/if}
	</button>
{/if}

<style lang="scss">
	@use "../assets/shared" as *;

	button {
		@include linearGradient(10%, hsl(225, 32.7%, 42%));
		background-color: hsl(226, 47.5%, 27.6%);
		color: white;
		border-radius: 5px;
		border: 1px solid rgba(230, 230, 230, 0.6);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.6);
		min-width: fit-content;
		padding: 2px 5px;
		font-weight: 600;

		&:focus {
			@include linearGradient(10%, hsl(225, 27.6%, 49.8%));
			background-color: hsl(226, 37%, 35.5%);
		}
	}
	/*
	button {
		font-weight: 500;
		background-color: #5865f2;
		margin-bottom: 8px;
		height: 40px;
		width: 100%;
		padding: 10px;
		color: white;
		border: none;
		outline: none;
		border-radius: 3px;
		background-image: none;
		line-height: 1;
		font-size: 16px;

		&:focus {
			background-color: #3c45a5 !important;
		}
	}*/

	/**
 * ==============================================
 * Dot Flashing
 * ==============================================
 */

	.dot-wrap {
		width: 100%;
		min-width: 30px;
	}

	.dot-flashing {
		position: relative;
		width: 10px;
		height: 10px;
		border-radius: 5px;
		background-color: #9880ff;
		color: #9880ff;
		animation: dotFlashing 0.8s infinite linear alternate;
		animation-delay: 0.5s;
		display: inline-block;
		transform: scale(0.7);

		&::before {
			content: "";
			display: inline-block;
			position: absolute;
			top: 0;
			left: -15px;
			width: 10px;
			height: 10px;
			border-radius: 5px;
			background-color: #9880ff;
			color: #9880ff;
			animation: dotFlashing 1s infinite alternate;
			animation-delay: 0s;
		}

		&::after {
			content: "";
			display: inline-block;
			position: absolute;
			top: 0;
			left: 15px;
			width: 10px;
			height: 10px;
			border-radius: 5px;
			background-color: #9880ff;
			color: #9880ff;
			animation: dotFlashing 1s infinite alternate;
			animation-delay: 1s;
		}
	}

	@keyframes dotFlashing {
		0% {
			background-color: #9880ff;
		}
		50%,
		100% {
			background-color: #ebe6ff;
		}
	}
</style>
