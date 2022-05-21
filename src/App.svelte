<script>
	import Channel from "./components/Channel.svelte";
	import Channels from "./components/Channels.svelte";
	import Messages from "./components/Messages.svelte";
	import Separator from "./components/Separator.svelte";
	import Servers from "./components/Servers.svelte";

	let avatar = "https://cdn.discordapp.com/avatars/159985870458322944/b50adff099924dd5e6b72d13f77eb9d7.jpg";

	let selected = 1;

	let channels = [
		{ type: "channel", status: "offline", subtext: "Test", avatar, name: "MEE6" },
		{ type: "channel", mentions: 2, status: "offline", subtext: "Test", avatar, name: "MEE6" },
		{ type: "channel", status: "offline", subtext: "Test", avatar, name: "MEE6" },
		{ type: "channel", unread: true, status: "offline", subtext: "Test", avatar, name: "MEE6" },
		{ type: "channel", name: "general", ch_type: "limited" },
		{ type: "channel", name: "general" },
		{ type: "channel", name: "general", ch_type: "announce" },
	];

	let isChannel = (o) => !!(o.name && o.type === "channel");
	window.addChannel = (obj) => (channels = [...channels, obj]);
	window.setSelect = (o) => (selected = o);
</script>

<Servers {selected} />
<Channels {selected}>
	<Separator>Test</Separator>
	{#each channels as channel}
		{#if isChannel(channel)}
			<Channel {...channel}>{channel.name || ""}</Channel>
		{/if}
	{/each}
</Channels>
<Messages {selected} />

<style>
</style>
