<script>
	import ActionMessage from "./ActionMessage.svelte";
	import Pin from "../icons/Pin.svelte";

	export let message,
		guildID,
		roles = null;
</script>

<ActionMessage id={message.id} author={message.author} {guildID} {roles}>
	<svelte:fragment slot="icon"><Pin /></svelte:fragment>
	<svelte:fragment slot="after">{" pinned a message to this channel."}</svelte:fragment>
</ActionMessage>
