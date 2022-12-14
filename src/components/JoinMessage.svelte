<script>
	import { onMount } from "svelte";
	import ActionMessage from "./ActionMessage.svelte";

	export let snowflake = null;
	export let message,
		guildID,
		roles = null;

	const greetings = [
		" joined the party.",
		" is here.",
		["Welcome, ", ". We hope you brought pizza."],
		["A wild ", " appeared."],
		" just landed.",
		" just slid into the server.",
		" just showed up!",
		["Welcome ", ". Say hi!"],
		" hopped into the server.",
		["Everyone welcome ", "!"],
		["Glad you're here, ", "."],
		["Good to see you, ", "."],
		["Yay you made it, ", "!"],
	];

	let before = "",
		after = "";

	onMount(() => {
		const greet = greetings[snowflake % greetings.length];
		if (typeof greet == "string") {
			after = greet;
		} else {
			[before, after] = greet;
		}
	});
</script>

<ActionMessage id={message.id} author={message.author} {guildID} {roles}>
	<svg slot="icon" height="18" width="18" xmlns="http://www.w3.org/2000/svg"
		><g fill="none" fill-rule="evenodd"
			><path d="m18 0h-18v18h18z" /><path
				d="m0 8h14.2l-3.6-3.6 1.4-1.4 6 6-6 6-1.4-1.4 3.6-3.6h-14.2"
				fill="#3ba55c"
			/></g
		></svg
	>
	<svelte:fragment slot="before"><span class="text">{before}</span></svelte:fragment>
	<svelte:fragment slot="after"><span class="text">{after}</span></svelte:fragment>
</ActionMessage>

<style>
	.text {
		color: rgb(150, 152, 157);
	}
</style>
