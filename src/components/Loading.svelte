<script>
	import { onMount } from "svelte";
	let text = "";
	onMount(() => {
		const array = [
			"svelte is awesome",
			"Svelte Is Love, Svelte Is Life",
			"atm the app is connecting to the gateway",
			"Frank128 is God",
      "the app is made with blood",
      "never gonna give you up",
      "never gonna let you down"
		]; // wanna add something? just tell cyan in discord
		text = array[new Date() % array.length];
	});
</script>

<div id="loading">
	<img src="/css/loading.png" alt />
	<div id="dyk">DID YOU KNOW</div>
	<div id="fact">{text}</div>
</div>

<style>
	#loading {
		width: 100vw;
		height: 100vh;
		position: absolute;
		top: 0;
		left: 0;
		background-color: #2f3136;
		text-align: center;
	}
	#loading img {
		width: 200px;
		height: 200px;
		margin: 12px 0;
		display: inline-block;
	}
	#dyk {
		font-size: 12px;
		margin-top: -35px;
		font-weight: 600;
		margin-bottom: 8px;
	}
	#fact {
		font-size: 16px;
		height: 75px;
	}
</style>
