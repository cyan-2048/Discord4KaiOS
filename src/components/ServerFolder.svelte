<script>
	// components
	import Server from "./Server.svelte";
	import ServerMentions from "./ServerMentions.svelte";

	// js imports
	import { onMount, onDestroy } from "svelte";
	import { decimal2rgb, delay } from "../lib/helper";
	import { serverAck } from "../lib/database";
	import { eventHandler } from "../lib/EventEmitter";
	import { folderOpened } from "../lib/shared";

	export let guildID, color, id, name, type;
	export let servers = [];
	//	export let name;
	let mentions = 0;
	let unread = false;
	let open = false;
	let main;

	//	console.log("server color",name, color)

	const update = () => {
		unread = !!main.querySelector(".unread");
		mentions = [...main.querySelectorAll("[data-mentions]")].map((a) => Number(a.dataset.mentions) || 0).reduce((a, b) => a + b, 0);
	};

	function toggleOpen(e) {
		if (this !== e.target) return;
		$folderOpened[id] = open = !open;
		update();
		setTimeout(() => (!open ? main && main.focus() : main && main.querySelector("[data-focusable]")?.focus()), 50);
	}
	onMount(update);
	onMount(() => (open = $folderOpened[id] || false));
	onDestroy(
		eventHandler(serverAck, "update", async () => {
			await delay(50);
			update();
		})
	);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<main
	{id}
	data-type={type}
	data-name={name}
	tabindex="0"
	on:click={toggleOpen}
	bind:this={main}
	style={!open ? `background-color: rgba(${color ? decimal2rgb(color, true) : [88, 101, 242]},0.3)` : null}
	data-focusable={open ? null : ""}
	data-folder
	class:open
	class:unread
>
	<div class="hover" />
	{#if open}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<div on:click={toggleOpen} tabindex="0" data-focusable class="folder-toggle">
			<div class="hover" />
		</div>
	{/if}
	{#each servers as server (server.id)}
		<Server focusable={open} on:select selected={guildID === server.id} {server} />
	{/each}
	{#if mentions > 0 && !open}
		<ServerMentions color="#202225">{mentions}</ServerMentions>
	{/if}
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	main {
		position: relative;
		margin-bottom: 8px;
		border-radius: 5px;

		&.open {
			box-shadow: inset 0 0 0 1px rgba(230, 230, 230, 0.6), 0 0 2px 2px rgba(0, 0, 0, 0.4), inset 0 0 1px 2px rgba(0, 0, 0, 0.8) !important;
		}

		&:not(.open) {
			box-shadow: inset 0 0 0 1px rgba(230, 230, 230, 0.8), inset 0 0 0 2px rgba(0, 0, 0, 0.6) !important;
			&.unread {
				.hover::after {
					opacity: 1;
				}
			}

			width: 48px;
			height: 48px;
			position: relative;

			/*.hover::after {
				transition: height 0.3s ease, opacity 0.3s ease;
			}*/

			&:focus {
				.hover::after {
					opacity: 1;
					height: 25px;
				}
			}

			@include linearGradient(5%, var(--gradient-color, rgba(36, 36, 38, 0.8)));
		}

		.folder-toggle {
			width: 48px;
			height: 48px;
			position: relative;
			margin-bottom: 8px;

			border-radius: 5px;
			box-shadow: inset 0 0 0 1px rgba(230, 230, 230, 0.6), inset 0 0 0 2px rgba(0, 0, 0, 0.6) !important;

			//background-color: rgba(67, 69, 74);

			/*.hover::after {
				transition: height 0.3s ease, opacity 0.3s ease;
			}*/

			@include linearGradient(5%, rgb(36, 36, 38));

			&:focus {
				@include linearGradient(5%, rgba(32, 42, 65));
				.hover::after {
					opacity: 1;
					height: 25px;
				}
			}

			&::after {
				content: "";
				width: 100%;
				height: 100%;
				position: absolute;
				top: 0;
				left: 0;
				background-image: url(/css/folder.png);
				background-size: cover;

				image-rendering: pixelated;
				image-rendering: optimizeSpeed;
			}
		}

		&:last-child {
			margin-bottom: 0;
		}

		.hover {
			position: absolute;
			height: 100%;
			width: 10px;
			left: -17px;
			display: grid;
			align-items: center;

			&::after {
				content: "";
				@include linearGradient(10%, rgba(234, 234, 234));
				background-color: rgba(155, 155, 155);
				border: 1px solid black;
				box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.3), inset 0 0 0 1px white;

				width: 10px;
				border-radius: 80px;
				display: block;
				height: 10px;
				opacity: 0;
			}
		}
	}
</style>
