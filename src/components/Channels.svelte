<script>
	export let selected;
</script>

<div data-channels class="{['zero', '', 'two'][selected] || ''} {selected === 1 ? 'selected' : ''}"><slot /></div>

<style>
	div {
		transition: transform 0.4s ease;
		background-color: #2f3136;
		overflow: auto;
		top: 0;
		left: 0;
		height: 100vh;
		position: absolute;
		width: 100vw;
		z-index: 1;
	}
	.zero {
		transform: translateX(-100vw);
	}
	.two {
		transform: translateX(72px);
	}
</style>
