<script>
	export let color = null;
	let main;
</script>

<div bind:this={main} style:border-color={color}>
	<slot />
</div>

<style lang="scss">
	div {
		display: block !important;
		position: absolute;
		border-radius: 20px;
		background-color: #ed4245;
		color: white;
		height: 15px;
		min-width: 15px;
		padding: 7px 3.9px;
		font-size: 12px;
		bottom: 0;
		right: 0;
		line-height: 0;
		border: solid 3px #202225;
	}
</style>
