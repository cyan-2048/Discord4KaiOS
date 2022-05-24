<script>
	export let selected;
	let main;
	$: selected === 0 && main && main.focus();
</script>

<main bind:this={main} tabindex="0" class="{['zero', 'one'][selected] || ''} {selected === 0 ? 'selected' : ''}">
	<slot />
</main>

<style>
	main {
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
