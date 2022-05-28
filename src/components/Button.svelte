<script>
	import { createEventDispatcher } from "svelte";
	export let onclick = Promise.resolve(true);
	let dispatch = createEventDispatcher();
	let state = 0;
	let changeOfState = async () => {
		if (state === 1) return;
		state = 1;
		try {
			let wait = await onclick();
			!!wait ? dispatch("success") : dispatch("error");
		} catch (error) {
			console.error(error);
			dispatch("error", { error });
		} finally {
			state = 0;
		}
	};
</script>

<button on:click={changeOfState}>
	{#if !state}
		<slot />
	{:else}
		<div class="dot-flashing" />
	{/if}
</button>

<style>
	button {
		font-weight: 500;
		background-color: rgb(88, 101, 242);
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
	}

	button:focus {
		background-color: rgb(60, 69, 165) !important;
	}

	/**
 * ==============================================
 * Dot Flashing
 * ==============================================
 */
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
	}

	.dot-flashing::before,
	.dot-flashing::after {
		content: "";
		display: inline-block;
		position: absolute;
		top: 0;
	}

	.dot-flashing::before {
		left: -15px;
		width: 10px;
		height: 10px;
		border-radius: 5px;
		background-color: #9880ff;
		color: #9880ff;
		animation: dotFlashing 1s infinite alternate;
		animation-delay: 0s;
	}

	.dot-flashing::after {
		left: 15px;
		width: 10px;
		height: 10px;
		border-radius: 5px;
		background-color: #9880ff;
		color: #9880ff;
		animation: dotFlashing 1s infinite alternate;
		animation-delay: 1s;
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
