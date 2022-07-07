<script context="module">
	import Alert from "./Alert.svelte";
	import Confirm from "./Confirm.svelte";
	import Prompt from "./Prompt.svelte";

	let stateFunc = null;

	export function alert(...args) {
		return stateFunc(Alert, args);
	}

	export function confirm(...args) {
		return stateFunc(Confirm, args);
	}

	export function prompt(...args) {
		return stateFunc(Prompt, args);
	}

	let pendingCallback = null;

	//	const capitalize = (s) => (s && s[0].toUpperCase() + s.slice(1)) || "";
</script>

<script>
	import { asyncQueueGenerator } from "../lib/helper";

	let component = null;
	let args = null;

	stateFunc = asyncQueueGenerator(async function (state, _args) {
		component = null;
		args = null;
		component = state;
		args = _args;
		return await new Promise((res) => {
			pendingCallback = function (result) {
				component = null;
				args = null;
				pendingCallback = null;
				res(result);
			};
		});
	}, true);
</script>

{#if component}
	<svelte:component this={component} {args} callback={pendingCallback} />
{/if}

<style>
	:global([data-modal]) {
		overflow: hidden;
		position: fixed;
		width: 100vw;
		height: 100vh;
		top: 0;
		left: 0;
		background-color: rgba(0, 0, 0, 0.85);
		z-index: 9999999;
	}
	:global([data-modal] .container) {
		display: flex;
		flex-direction: column;
		position: fixed;
		bottom: 5px;
		width: calc(100vw - 10px);
		left: 5px;
	}
	:global([data-modal] .button_container) {
		display: flex;
	}
</style>
