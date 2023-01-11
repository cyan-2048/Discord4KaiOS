<script>
	import { onMount } from "svelte";
	import { decimal2rgb, delay, hashCode, stringifyDate } from "../lib/helper";
	import { serverProfiles } from "../lib/shared";
	import Mentions from "./Mentions.svelte";

	export let guildID, user, message;
	export let roles = null;

	const image = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpg?size=24` : null;
</script>

<main data-separator>
	<img src={image || "/css/default.png"} alt />
	<div class="name">
		<div class="user">
			<b><Mentions {guildID} mentions={false} type="user" username={user.username} id={user.id} {roles} prefix={false} /></b>
		</div>
		{#if user.bot}
			<div class="bot">{user.discriminator === "0000" ? "WEBHOOK" : "BOT"}</div>
		{/if}
		<div class="date">{stringifyDate(message.timestamp)}</div>
	</div>
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	.bot {
		font-size: 8px;
		display: inline-block;
		padding: 2px 4px;
		height: 12px;
		border-radius: 4px;
		line-height: 1;
		margin: 0 2px;
		align-self: center;
		@include linearGradient(10%, hsl(225, 32.7%, 42%));
		background-color: hsl(226, 47.5%, 27.6%);
		box-shadow: 0 0 0 1px rgba(230, 230, 230, 0.6), inset 0 0 0 1px rgba(0, 0, 0, 0.6);
	}
	main {
		display: flex;
		height: 17px;
		margin-left: -32px;
	}
	img {
		width: 24px;
		height: 24px;
		margin-left: 2px;
		margin-top: 2px;

		border-radius: 3px;
		border: 1px solid rgba(0, 0, 0, 0.4);
		box-shadow: 0 0 0 1px rgba(230, 230, 230, 0.6), 0 0 3px 3px rgba(0, 0, 0, 0.4);
		aspect-ratio: 1 / 1;
	}
	.name {
		width: 100%;
		white-space: nowrap;

		margin-left: 5.5px;
		font-size: 13.2px;
		line-height: 1.2;

		display: flex;

		&,
		.user {
			overflow: hidden;
		}

		.date {
			color: rgb(190, 190, 190);
			font-size: 10px;
			font-weight: 600;
			padding: 3px 4px;
			line-height: 1;
		}

		.user {
			min-width: 0;
			text-overflow: ellipsis;
		}
	}
</style>
