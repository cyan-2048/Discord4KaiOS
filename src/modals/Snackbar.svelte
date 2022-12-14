<script>
	import { slide } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
</script>

<div transition:slide={{ duration: 200, easing: cubicOut }}><slot /></div>

<style lang="scss">
	@use "../assets/shared" as *;

	div {
		&:first-child {
			margin-top: auto;
		}
		@include linearGradient(42%, rgba(70, 80, 86));
		background-color: rgba(52, 54, 58);
		border: 1px solid rgba(230, 230, 230, 0.6);
		border-radius: 5px;
		box-shadow: 0 0 3px 3px rgba(0, 0, 0, 0.6);
		color: white;

		width: -moz-fit-content;
		max-width: 80vw;
		margin-left: auto;
		margin-right: auto;
		flex-grow: 0;
		margin-bottom: 5px;
		padding: 4px 10px;
		font-size: 14px;
		font-weight: 600;
	}
</style>
