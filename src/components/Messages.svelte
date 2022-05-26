<script>
	export let selected;
</script>

<div data-messages class="{['zero', 'one'][selected] || ''} {selected === 0 ? 'selected' : ''}">
	<slot />
</div>

<style>
	div {
		transition: transform 0.4s ease;
		width: 100vw;
		height: 100vh;
		position: absolute;
		transform: translateX(100vw);
		top: 0;
		left: 0;
		overflow: auto;
		background-color: #36393f;
	}
	.one {
		transform: translateX(50vw);
	}
	.zero {
		transform: none;
	}
</style>
