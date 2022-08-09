<script>
	import { onMount } from "svelte";
	let text = "";
	onMount(() => {
		const array = [
			"Quickly edit your last sent message! Type 's/[what to replace]/[what to replace with]'.",
			"Press 0 at any point in message history to scroll to the latest.",
			"This third-party application is open-sourced on GitHub and NotABug. Links in Settings.",
			"We have a dedicated server for support on this application! Check it out in Settings.",
      			"Don't ask for ETAs. We're all humans.",
      			"never gonna give you up",
      			"Connecting to Discord's gateways to retrieve account info, server list and message history...",
			"This application is built on Frank128's prototype of Discord for Windows XP, coded in several nights.",
			"Have something to hide in your message? ||Mark it as spoiler.||",
			"To strike-through a part of message, ~~put it in these~~.",
			"To italicize a part of message, *put it in these* or _these_.",
			"To mark a part of message as code, `put it in these`.",
			"Add a hyperlink to your message! Here's an [example](https://www.example.com).",
			"Emphasize a part of your message by **making them bold**.",
			"Group DMs can have up to ten members.",
			"The top-most role for a user defines that user's color.",
			"When rocking this app, you'll have a RPC status to tell the world. Disable in Settings.",
			"No I didn't.",
			"idk search Google for tips"
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
