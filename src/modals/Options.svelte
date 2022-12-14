<script>
	import { onMount, tick } from "svelte";
	import { delay, hashCode, Promise_defer } from "../lib/helper";
	import { sn } from "../lib/shared";
	let queue = [];

	const id = "_" + hashCode(Math.random() * 100);

	onMount(() => {
		sn.add(id, { selector: `#${id} div > [tabindex]`, restrict: "self-only" });
		return () => sn.remove(id);
	});

	export let push;
	push = async function push(options = [], { focusIndex = 0 } = {}, _callback = null) {
		const { promise, resolve: res } = Promise_defer();

		if (options.length < 1) throw new Error("no options given!");

		function done(result) {
			res(result);
			_callback?.(result);
		}

		queue.push({
			options: options.filter((a) => a),
			focusIndex,
			async callback(result) {
				await delay(50);
				done(result);
				queue.shift();
				queue = queue;
			},
		});
		queue = queue; // tell compiler array changed

		return promise;
	};

	let main;

	$: if (queue[0]) {
		tick().then(() => sn.focus(id));
	}

	window.options_push = push;
</script>

{#if queue[0]}
	<main
		{id}
		on:keydown={function (e) {
			if (e.key === "Backspace") {
				e.preventDefault();
				e.stopImmediatePropagation();
				e.stopPropagation();
				queue[0].callback(null);
			}
			if (e.key === "Enter") {
				e.target.click();
			}
		}}
		bind:this={main}
	>
		<div class="backdrop">
			{#each queue[0].options as option, tabindex}
				<div
					on:click={() => {
						queue[0].callback(option.id || option.name || option.title || option);
					}}
					{tabindex}
				>
					{option.name || option.title || option.id || option}
				</div>
			{/each}
		</div>
	</main>
{/if}

<style lang="scss">
	@use "../assets/shared" as *;

	main {
		position: fixed;
		z-index: 9999;
		width: 100vw;
		height: 100vh;
		top: 0;
		background-color: rgba(25, 25, 25, 0.4);
		left: 0;
		display: flex;
		flex-direction: column;
	}
	/*
	div.select {
		width: 100%;
		text-align: center;
		font-weight: 700;
	}*/

	div.backdrop {
		height: fit-content;
		width: calc(100% - 4px);
		margin-top: auto;
		margin-left: 2px;
		margin-bottom: 2px;

		/*
		border: 2px solid rgba(0, 0, 0, 0.6);
		border-radius: 8px;
		background-color: rgba(0, 0, 0, 0.2);
		*/
		border: 1px solid rgba(92, 92, 92);
		box-shadow: 0 0 3px 3px rgba(0, 0, 0, 0.4);
		@include linearGradient(35%, hsl(220, 7.7%, 22.9%));
		background-color: hsl(210, 3.4%, 11.4%);
		border-radius: 5px;
		padding: 4px 4px;

		div {
			margin: 2px;
			padding: 4px 8px;
			border-radius: 5px;
			font-weight: 600;
			font-size: 15px;
			color: rgb(185, 187, 190);

			&:focus {
				@extend %focus;
			}
		}
	}
</style>
