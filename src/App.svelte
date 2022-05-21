<script>
	import Channel from "./components/Channel.svelte";
	import Channels from "./components/Channels.svelte";
	import Messages from "./components/Messages.svelte";
	import Separator from "./components/Separator.svelte";
	import Servers from "./components/Servers.svelte";
	import { onMount } from "svelte";
	import { DiscordXHR } from "./lib/DiscordXHR.js";
	import Message from "./components/Message.svelte";
	let discord = new DiscordXHR(/*{ cache: true }*/);

	let avatar = "https://cdn.discordapp.com/avatars/159985870458322944/b50adff099924dd5e6b72d13f77eb9d7.jpg";

	let selected = 1;

	/*let channels = [
		{ type: "channel", status: "offline", subtext: "Test", avatar, name: "MEE6" },
		{ type: "channel", mentions: 2, status: "offline", subtext: "Test", avatar, name: "MEE6" },
		{ type: "channel", status: "offline", subtext: "Test", avatar, name: "MEE6" },
		{ type: "channel", unread: true, status: "offline", subtext: "Test", avatar, name: "MEE6" },
		{ type: "channel", name: "general", ch_type: "limited" },
		{ type: "channel", name: "general" },
		{ type: "channel", name: "general", ch_type: "announce" },
	];*/

	let channels = [];
	let messages = [];

	let ready = false;

	let loadDMS = async () => {
		let dms = await discord.getChannelsDM();
		let sift = dms.map((ch) => {
			let name =
				ch.name ||
				ch.recipients
					.map(function (x) {
						return x.username;
					})
					.join(", ");

			let { id, icon, recipients } = ch;
			let { id: user_id, avatar } = recipients[0];

			return {
				type: "channel",
				name,
				id,
				avatar: !icon && !avatar ? "/css/default.png" : `https://cdn.discordapp.com/${icon ? "channel-icons" : "avatars"}/${icon ? id : user_id}/${icon || avatar}.jpg`,
			};
		});
		console.log(sift);
		channels = sift;
		return sift;
	};

	let loadMessages = async (channel, roles, serverProfile) => {
		let msgs = await discord.getMessages(channel, 30);
		console.log(msgs);
		messages = msgs;
	};

	let init = async () => {
		ready = true;
		let dms = await loadDMS();
		loadMessages(dms[0].id);
	};

	onMount(() => {
		if (localStorage.token) {
			discord.login(localStorage.token);
			init();
		} else {
			window.login = (e) => {
				localStorage.token = e;
				init();
			};
		}
	});

	window.discord = discord;

	let isChannel = (o) => !!(o.name && o.type === "channel");
	window.addChannel = (obj) => (channels = [...channels, obj]);
	window.setSelect = (o) => (selected = o);
</script>

{#if ready}
	<Servers {selected} />
	<Channels {selected}>
		<Separator>Test</Separator>
		{#each channels as channel}
			{#if isChannel(channel)}
				<Channel {...channel}>{channel.name || ""}</Channel>
			{/if}
		{/each}
	</Channels>
	<Messages {selected}>
		{#each messages as message}
			<Message {message} />
		{/each}
	</Messages>
{/if}

<style>
</style>
