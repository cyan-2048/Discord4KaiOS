<script>
	export let selected;
	export let appState;
</script>

<main
	data-servers
	style:display={appState !== "app" ? "none" : null}
	class:two={selected === 2}
	class:selected={selected === 2}
>
	<slot />
</main>

<style>
	main {
		transition: transform 0.4s ease;
		width: 72px;
		height: 100vh;
		position: absolute;
		transform: translateX(-72px);
		top: 0;
		left: 0;
		overflow: hidden;
		background-color: #202225;
		padding: 8px 12px;
		overflow-y: auto;
		z-index: 3;
	}
	.two {
		transform: none;
	}
</style>
