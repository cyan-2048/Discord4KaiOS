<script>
	import { onMount } from "svelte";
	import { decimal2rgb, delay, hashCode } from "../lib/helper";
	import { discordGateway } from "../lib/shared";

	export let id = null;
	export let name = null;
	export let avatar = null;
	export let channel;
	export let profile;
	export let userID;
	export let guildID;
	export let cachedMentions;
	export let roles = null;
	export let bot;
	export let discriminator;

	let color;
	let nick;
	let main;

	let image = avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.jpg?size=24` : null;

	async function update(_profile = profile) {
		if (channel.dm) return;
		if (id && discriminator !== "0000" /*i think this is how we can differ webhooks*/) {
			const args = ["getServerProfile", guildID, id];
			if (hashCode(args.join("")) in cachedMentions.cache === false) await delay(600);
			let s_profile = userID === id ? _profile : await cachedMentions(...args);
			if (!s_profile || !s_profile.roles) return;
			nick = s_profile.nick;
			if (roles) {
				let role = [...roles]
					.sort((a, b) => b.position - a.position)
					.find((o) => s_profile.roles.includes(o.id) && o.color > 0);
				if (role) color = decimal2rgb(role.color, true);
			}
		}
	}

	onMount(() => {
		update();
		function member_handler(d) {
			if (d.user.id === id) {
				update(d);
			}
		}
		function handleFocus() {
			const nextEl = main.nextElementSibling;
			if (nextEl && nextEl.matches("[data-focusable]")) {
				main.style.backgroundColor = getComputedStyle(nextEl).backgroundColor;
			}
		}
		if (main.nextElementSibling) {
			const nextEl = main.nextElementSibling;
			nextEl.addEventListener("blur", handleFocus);
			nextEl.addEventListener("focus", handleFocus);
		}
		discordGateway.on("t:guild_member_update", member_handler);
		handleFocus();
		main.addEventListener("change_color", handleFocus);
		return () => {
			if (main.nextElementSibling) {
				const nextEl = main.nextElementSibling;
				nextEl.removeEventListener("blur", handleFocus);
				nextEl.removeEventListener("focus", handleFocus);
			}
			discordGateway.off("t:guild_member_update", member_handler);
		};
	});
</script>

<main bind:this={main} data-separator>
	<img src={image || "/css/default.png"} alt /><b style={color ? `color: rgb(${color});` : null}>{nick || name}</b
	>{#if bot}
		<div class="bot">{discriminator === "0000" ? "WEBHOOK" : "BOT"}</div>
	{/if}
</main>

<style>
	.bot {
		font-size: 8px;
		display: inline-block;
		padding: 2px 4px;
		height: 12px;
		border-radius: 4px;
		line-height: 1;
		margin: 0 2px;
		align-self: center;
		background-color: rgb(88, 101, 242);
	}
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
