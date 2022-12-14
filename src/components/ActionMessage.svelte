<script>
	export let id;

	import { queryProfiles, serverProfiles } from "../lib/shared";
	import Mentions from "./Mentions.svelte";

	export let author,
		guildID,
		roles = null,
		iconColor = null;

	export let color = null,
		name = author.username;

	function updatedName(serverProfiles) {
		const user = author;
		if (guildID !== "@me" && user.id && user.discriminator !== "0000") {
			const profile = serverProfiles.get(guildID + "/" + user.id);
			if (profile) {
				if (profile.nick && profile.nick !== name) {
					name = profile.nick;
				}

				if (roles) {
					let role = [...roles]
						.sort((a, b) => b.position - a.position)
						.find((o) => profile.roles.includes(o.id) && o.color > 0);

					if (role !== undefined) color = Number(role.color).toString(16);
				}
			} else {
				queryProfiles.add(user.id);
			}
		}
	}

	$: updatedName($serverProfiles, roles);
</script>

<main id={"msg" + id} data-focusable tabindex="0">
	<div class="icon" style:color={iconColor}>
		<slot name="icon" />
	</div>
	<div>
		<slot name="before" /><Mentions
			type="user"
			username={author.username}
			id={author.id}
			{guildID}
			prefix={false}
			mentions={false}
			{roles}
		/><slot name="after" />
	</div>
</main>

<style lang="scss">
	@forward "../assets/shared";

	main {
		display: flex;
		font-size: 13px;
		padding: 2px 0;
		padding-right: 5px;
		margin: 2px 0;

		.icon {
			width: 32px;
			display: flex;
			flex-shrink: 0;

			:global {
				svg {
					width: 18px;
					height: 18px;
					margin: auto;
					transform: scale(0.8);
				}
			}
		}

		&:focus {
			@extend %MessageFocus;
		}
	}
</style>
