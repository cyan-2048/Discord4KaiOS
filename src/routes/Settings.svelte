<script>
	import { onMount } from "svelte";
	import Button from "../components/Button.svelte";
	import Switch from "../components/Switch.svelte";
	import { back, centerScroll, delay, hashCode, navigate } from "../lib/helper";
	import { sn } from "../lib/shared";
	import { snackbar } from "../modals";

	export let settings;

	const id = "_" + hashCode(Math.random() * 100);

	onMount(() => {
		sn.add(id, { selector: `#${id} [tabindex]`, restrict: "self-only" });
		delay(50).then(() => sn.focus(id));
		return () => sn.remove(id);
	});

	$: toggles = getToggles($settings);

	function getToggles(settings) {
		const set = new Set();
		for (const key in settings) {
			const val = settings[key];
			if (typeof val === "boolean") {
				set.add(key);
			}
		}
		return set;
	}

	const setting_names = {};
</script>

<main
	on:focus|capture={(e) => centerScroll(e.target)}
	on:keydown={async function ({ key, target }) {
		if (key === "Backspace") {
			await delay(50);
			await back();
		}
		if (key === "Enter") {
			target.click();
		}
	}}
	{id}
>
	<div class="title">Settings</div>
	{#each Object.keys($settings) as key}
		{#if toggles.has(key)}
			<div
				class="toggles"
				on:click={() => {
					if (key == "custom_rpc") snackbar("requires restart!", 3000);
					$settings[key] = !$settings[key];
				}}
				tabindex="0"
			>
				{setting_names[key] || key}
				<Switch on={!!$settings[key]} />
			</div>
		{/if}
	{/each}
	<div class="button-wrapper">
		<Button onClick={() => navigate("/about")}>About</Button>
	</div>
	<div class="button-wrapper">
		<Button onClick={() => navigate("/privacy")}>Privacy Policy</Button>
	</div>
	<!--
<Button
		onClick={async () => {
			const css = await kai_picker();
			const style = document.createElement("style");
			style.innerText = css;
			document.documentElement.appendChild(style);
		}}>Inject CSS (WIP)</Button
	>
	-->
</main>

<style lang="scss">
	@use "../assets/shared";

	main {
		position: fixed;
		height: 100vh;
		width: 100vw;
		z-index: 999;
		top: 0;
		left: 0;
		padding: 4px 4px;
		@extend %layer1;
		overflow: auto;

		.toggles {
			margin: 2px;
			padding: 6px 8px;
			border-radius: 5px;
			font-weight: 600;
			font-size: 15px;
			color: rgb(185, 187, 190);
			display: flex;
			justify-content: space-between;
		}

		.button-wrapper {
			width: 100%;
			display: flex;
			:global {
				.Button {
					margin: 4px 5px;
					padding: 5px 7px;
					width: 100%;
				}
			}
		}

		.title {
			font-size: 17px;
			font-weight: 600;
			padding: 0 8px;
		}
	}

	div {
		&:focus {
			@extend %focus;
		}
	}

	:global(body.light) {
		main {
			@extend %layer1-light;
		}
		div:focus {
			@extend %focus-light;
		}
	}
</style>
