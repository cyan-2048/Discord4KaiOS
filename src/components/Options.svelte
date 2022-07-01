<script>
	import { createEventDispatcher, onMount, tick } from "svelte";
	import { delay, hashCode } from "../lib/helper";
	import { sn } from "../lib/shared";

	const id = hashCode(String(Math.random()));
	const dispatch = createEventDispatcher();
	let closing = false;

	export async function close(d = 300) {
		closing = true;
		await delay(d);
		await tick();
		dispatch("close");
	}

	onMount(() => {
		sn.add({
			id: id + "-opts",
			selector: `#${id}-opts > *`,
			restrict: "self-only",
		});

		sn.focus(id + "-opts");

		function onkeydown({ target, key }) {
			if (key === "Enter") {
				target.click();
			}
			if (key === "Backspace") {
				close();
			}
		}
		window.addEventListener("keydown", onkeydown);
		return () => {
			sn.remove(id + "-opts");
			document.activeElement.blur();
			window.removeEventListener("keydown", onkeydown);
		};
	});
</script>

<main id="{id}-opts" class:closing>
	<slot />
</main>

<style>
	.closing {
		bottom: -100vh;
	}

	main {
		width: calc(100vw - 10px);
		position: fixed;
		bottom: 5px;
		left: 5px;
		padding: 8px;
		background-color: #18191c;
		z-index: 3;
		animation: opening 0.2s ease;
		transition: bottom ease 0.2s;
		border-radius: 5px;
	}
	main > :global(*) {
		height: 32px;
		font-size: 14px;
		font-weight: 600;
		user-select: none;
		border-radius: 3px;
		line-height: 18px;
		padding: 7px 7px;
		display: flex;
		color: rgb(185, 187, 190);
		justify-content: space-between;
	}
	main > :global(*:focus) {
		background-color: #4752c4;
		color: white !important;
	}

	@keyframes opening {
		from {
			bottom: -100vh;
		}
		to {
			bottom: 5px;
		}
	}
</style>
