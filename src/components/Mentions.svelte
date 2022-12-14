<script>
	import { onMount } from "svelte";
	import { discord } from "../lib/database";
	import { decimal2rgb } from "../lib/helper";
	import { queryProfiles, serverProfiles, userProfiles } from "../lib/shared";

	export let type,
		id,
		roles = null,
		guildID = null,
		prefix = true,
		mentions = true,
		username = "loading...";

	let text = "",
		style = null;

	$: me = id === discord.user.id;

	function prefi(s) {
		return prefix ? s : "";
	}

	function getUser(serverProfiles, userProfiles) {
		const profile = (guildID && serverProfiles.get(guildID + "/" + id)) || userProfiles.get(id);
		if (!profile) {
			queryProfiles?.add(id);
			return;
		}
		if (guildID !== "@me" && roles && !mentions && profile.roles) {
			const role = roles
				.sort((a, b) => b.position - a.position)
				.find((o) => profile.roles.includes(o.id) && o.color > 0);
			if (role) style = `color:#${Number(role.color).toString(16)}`;
		}
		text = prefi("@") + (profile.nick || profile.user?.username || profile.username);
	}

	function getRole(roles) {
		const role = roles?.find((e) => e.id === id);
		if (role && role.color > 0) {
			const rgb = decimal2rgb(role.color, true);
			style = `color:rgb(${rgb});background-color:rgba(${rgb},0.3)`;
		}
		text = prefi("@") + (role?.name || "deleted-role");
	}

	onMount(async () => {
		if (type === "channel") {
			text = "loading...";
			const channel = await discord.getChannel(id);
			text = prefi("#") + (channel?.name || "deleted-channel");
		}
	});

	$: type == "user" && getUser($serverProfiles, $userProfiles);
	$: type == "role" && getRole(roles);
</script>

<span class:me {style} class:mentions>{text || username}</span>
