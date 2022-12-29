<script>
	export let color = null;
	let main;
</script>

<div bind:this={main}>
	<slot />
</div>

<style lang="scss">
	div {
		display: block !important;
		position: absolute;
		border-radius: 20px;

		color: white;
		height: 19px;
		min-width: 19px;
		font-size: 13px;
		text-align: center;
		line-height: 16px;
		font-weight: 600;
		padding: 0 4px;
		bottom: 0;
		right: 0;

		background: linear-gradient(0deg, transparent 22%, rgba(217, 79, 77) 100%) !important;
		border: 1px solid rgba(230, 230, 230, 0.6);
		box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.5);
		background-color: rgba(158, 58, 56) !important;
	}
</style>
