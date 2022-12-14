<script>
	import ActionMessage from "./ActionMessage.svelte";
	import BoostedGuildTier2 from "../icons/BoostedGuildTier2.svelte";

	export let message,
		guildID,
		roles = null;
</script>

<ActionMessage iconColor="rgb(255, 115, 250)" id={message.id} author={message.author} {guildID} {roles}>
	<svelte:fragment slot="icon"><BoostedGuildTier2 /></svelte:fragment>
	<svelte:fragment slot="after">{" just boosted the server!"}</svelte:fragment>
</ActionMessage>
