<script>
	export let selected;
	export let appState;
</script>

<div data-servers style:display={appState !== "app" ? "none" : null} class={['', '', 'two'][selected] || ''} class:selected={selected === 2}><slot /></div>

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
