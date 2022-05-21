<script>
	export let selected;
</script>

<main class={["zero", "one", "two"][selected] || ""} />

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
		padding: 8px 12px 0 12px;
		overflow-y: auto;
	}
	.two {
		transform: none;
	}
</style>
