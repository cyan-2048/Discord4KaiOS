<script>
	import { onMount } from "svelte";
	import { decimal2rgb } from "../lib/helper";

	export let id = null;
	export let name = null;
	export let avatar = null;
	export let channel;
	export let profile;
	export let userID;
	export let guildID;
	export let cachedMentions;
	export let roles;
	export let bot;

	let color;

	let image = avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.jpg?size=24` : null;

	onMount(async () => {
		console.log("bot :", bot);
		if (!channel.dm && id && bot !== true) {
			let s_profile = userID === id ? profile : await cachedMentions("getServerProfile", guildID, id);
			if (!s_profile || !s_profile.roles) return;
			if (s_profile.nick) name = s_profile.nick;
			let role = [...roles].sort((a, b) => b.position - a.position).find((o) => s_profile.roles.includes(o.id) && o.color > 0);
			if (role) color = decimal2rgb(role.color, true);
		}
	});
</script>

<main>
	<img src={image || "/css/default.png"} alt /><b style={color ? `color: rgb(${color});` : null}>{name}</b>
</main>

<style>
	main {
		display: flex;
		height: 17px;
		margin-top: 6px;
	}
	img {
		width: 24px;
		height: 24px;
		margin-left: 4px;
		margin-top: 4px;
	}
	b {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		display: block;
		margin-left: 3.5px;
		font-size: 13.2px;
	}
</style>
