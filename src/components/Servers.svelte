<script>
	export let selected;
</script>

<div data-servers class="{['', '', 'two'][selected] || ''} {selected === 2 ? 'selected' : ''}"><slot /></div>

<style>
	div {
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
	}
	.two {
		transform: none;
	}
</style>
