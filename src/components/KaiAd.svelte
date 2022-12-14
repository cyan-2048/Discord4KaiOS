<script>
	let iframe;

	export function click() {
		try {
			return iframe.contentWindow.postMessage("click", "*");
		} catch (e) {
			console.error(e);
			return false;
		}
	}
</script>

<main tabindex="0" on:click={click} data-focusable>
	<iframe bind:this={iframe} src="https://cyan-2048.github.io/kaiads/" title="kaiad" frameborder="0" />
</main>

<style lang="scss">
	main {
		display: flex;
		height: 60px;

		&:focus {
			background-color: grey;
		}
	}

	iframe {
		pointer-events: none;
		margin: auto;
		height: 54px;
		width: 216px;
	}
</style>
