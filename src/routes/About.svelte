<script>
	import { onMount, tick } from "svelte";

	import { discord, discordGateway } from "../lib/database";
	import { serverProfiles, settings, sn, userProfiles } from "../lib/shared";
	import KaiAd from "../components/KaiAd.svelte";
	import { centerScroll } from "../lib/helper";
	import { dev_people, showAds, special_people } from "./stores";

	const serverID = "971795243974406215";

	let shoutout = null,
		developer = null,
		special = null,
		developers = null,
		special_thanks = [];

	let serverAvailable = false;

	const profiles = new Map();

	function findShoutouts(serverProfiles) {
		let size = profiles.size;

		for (const [key, val] of serverProfiles.entries()) {
			if (!key.startsWith(serverID) || profiles.has(key)) continue;
			if (val?.roles?.includes("972464208933425162")) {
				profiles.set(key, val);
			}
		}

		$settings.devmode && size !== profiles.size && console.log("shoutouts list:", profiles);

		return [...profiles.values()];
	}

	$: shoutouts = serverAvailable && findShoutouts($serverProfiles);

	const alreadyMentioned = new Set();

	async function checkServerAvailability() {
		const server = await discord.getServer(serverID);
		if (!server || server.message == 0) return;
		discordGateway.send({
			op: 8,
			d: { guild_id: [serverID], limit: 1000, presences: false, query: "", user_ids: undefined },
		});
		serverAvailable = true;
	}

	async function mapUsers([id, description]) {
		return [$userProfiles.get(id) || (await discord.getProfile(id)).user, description];
	}

	async function loadDevelopers() {
		const devs = [
			["733929955099934741", "Main Developer"],
			["708158103836688401", "Original Developer"],
		];
		developers = $dev_people || ($dev_people = await Promise.all(devs.map(mapUsers)));
		//console.error(developers);
	}

	async function loadSpecialThanks() {
		const peeps = [
			["257528678420840449", "Awesome Theme Maker!"],
			["875773600572010546", "Very Awesome!"],
			["374859398960513025", "Very Awesome!"],
		];
		special_thanks = $special_people || ($special_people = await Promise.all(peeps.map(mapUsers)));
		//console.error(special_thanks);
	}

	let thanks_cycle = 0;
	let devs_cycle = 0;

	async function loadShoutouts() {
		checkServerAvailability();
		await loadSpecialThanks();
		await loadDevelopers();
	}

	onMount(() => {
		const _interval = () => {
			if (developers) {
				developer = developers[devs_cycle];
				devs_cycle++;
				if (devs_cycle === developers.length) devs_cycle = 0;
			}

			if (special_thanks) {
				special = special_thanks[devs_cycle];
				thanks_cycle++;
				if (thanks_cycle === special_thanks.length) thanks_cycle = 0;
			}

			if (alreadyMentioned.size >= shoutouts.length) alreadyMentioned.clear();

			const pickRandom = () => shoutouts?.[Math.floor(Math.random() * shoutouts.length)];

			let attempts = 0;
			let selected = null;

			do {
				selected = pickRandom();
				attempts++;
				if (attempts > alreadyMentioned.size) {
					alreadyMentioned.clear();
				}
			} while (alreadyMentioned.has(selected?.user?.id));

			alreadyMentioned.add(selected?.user?.id);
			shoutout = selected;
		};

		loadShoutouts().then(_interval);

		const interval = setInterval(_interval, 4000);

		const id = Math.random().toString(32);

		sn.add(id, { selector: "#About_page [tabindex]" });
		sn.focus(id);

		return () => {
			sn.remove(id);
			clearInterval(interval);
		};
	});

	function getAvatar(user) {
		return user.avatar ? discord.getAvatarURL(user.id, user.avatar) : "/css/default.png";
	}
</script>

<svelte:window
	on:keydown={async ({ key }) => {
		if (key === "Backspace") {
			await tick();
			history.back();
		}
	}}
/>

<main on:focus|capture={({ target }) => centerScroll(target)} id="About_page">
	<div class="title">Discord4KaiOS</div>
	<div class="content" tabindex="0">
		<small>(or Sveltecord)</small> is the first actually usable Discord client for KaiOS.
	</div>
	<div class="content">The app's name is Sveltecord to avoid using the trademark.</div>
	{#if developer}
		<div class="title">Developers</div>
		{@const [user, description] = developer}
		<div data-focusable tabindex="0" class="shoutout">
			<img src={getAvatar(user)} alt={user.username} class="avatar" />
			<div class="details">
				<div class="nick">
					{user.nick || user.username || ""}
				</div>
				<div class="username">{description}</div>
			</div>
		</div>
	{/if}
	{#if special}
		<div class="title">Special Thanks</div>
		{@const [user, description] = special}
		<div data-focusable tabindex="0" class="shoutout">
			<img src={getAvatar(user)} alt={user.username} class="avatar" />
			<div class="details">
				<div class="nick">
					{user.nick || user.username || ""}
				</div>
				<div class="username">{description}</div>
			</div>
		</div>
	{/if}
	{#if shoutout}
		<div class="title">Shoutout</div>
		<div data-focusable tabindex="0" class="shoutout">
			<img src={getAvatar(shoutout.user)} alt={shoutout.user?.username} class="avatar" />
			<div class="details">
				<div class="nick">
					{shoutout.nick || shoutout.user?.username || ""}
				</div>
				<div class="username">@{shoutout.user?.username || ""}#{shoutout.user?.discriminator || ""}</div>
			</div>
		</div>
	{/if}
	{#if $showAds}
		<div class="title">Ads</div>
		<KaiAd />
	{/if}
	<div tabindex="0" class="content">
		Sveltecord is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Discord™, or any of its subsidiaries or its affiliates.
	</div>
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	main {
		height: 100%;
		overflow: auto;
		@extend %layer1;
		padding: 6px 6px;

		.title {
			font-size: 17px;
			font-weight: 600;
			padding: 0 6px;
		}

		.content {
			padding: 4px 6px;
			font-size: 14px;
		}

		.username,
		small {
			color: rgb(163, 166, 170);
		}

		.shoutout {
			&:focus {
				@include linearGradient(40%, rgba(97, 100, 106, 0.8));
				box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.32), inset 0 0 0 1px rgba(20, 20, 20);
				background-color: rgba(73, 75, 78);
			}

			padding: 12px 10px;
			border-radius: 5px;
			display: flex;

			.details {
				margin-left: 8px;
				font-size: 13px;

				display: flex;
				flex-direction: column;
				width: 100%;
				overflow: hidden;

				div {
					white-space: nowrap;
					text-overflow: ellipsis;
					overflow: hidden;
					width: 100%;
					line-height: 1.3;
				}
			}

			.avatar {
				border: 1px solid rgba(0, 0, 0, 0.4) !important;
				box-shadow: 0 0 0 2px rgba(230, 230, 230, 0.6), 0 0 4px 4px rgba(0, 0, 0, 0.5) !important;
				width: 32px;
				height: 32px;
				border-radius: 5px;
				margin-top: auto;
				margin-bottom: auto;
			}
		}
	}

	:global(body.light) {
		main {
			@extend %layer1-light;
		}
	}
</style>
