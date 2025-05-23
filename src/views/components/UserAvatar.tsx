import DEFAULT_AVATARS from "@/assets/avatars";
import { useStore } from "@/lib/utils";
import { DiscordGuild, DiscordServerProfile, DiscordUser, convertSnowflakeToDate } from "discord";
import { Match, Show, Switch, createSignal } from "solid-js";

interface AvatarProps {
	$: DiscordUser;
	size?: number;
}

function UserAvatarDefault(props: AvatarProps) {
	const defaultAvatar = DEFAULT_AVATARS[convertSnowflakeToDate(props.$.id).getTime() % DEFAULT_AVATARS.length];

	const _size = props.size ?? 32;

	console.log("DEFAULT AVATAR", defaultAvatar, DEFAULT_AVATARS, convertSnowflakeToDate(props.$.id));

	return <img src={defaultAvatar} width={_size + "px"} height={_size + "px"} />;
}

function UserAvatarGlobal(props: AvatarProps) {
	const avatar = useStore(() => props.$, "avatar");

	return (
		<Show when={avatar()} fallback={<UserAvatarDefault $={props.$} size={props.size} />}>
			<img src={`https://cdn.discordapp.com/avatars/${props.$.id}/${avatar()}.png?size=${props.size ?? 32}`} />
		</Show>
	);
}

function UserAvatarProfile(props: AvatarProps & { profile: DiscordServerProfile }) {
	const avatar = useStore(() => props.profile, "avatar");

	// may or may not work, who knows
	return (
		<Show when={avatar()} fallback={<UserAvatarGlobal $={props.$} size={props.size} />}>
			<img
				src={`https://cdn.discordapp.com/guilds/${props.profile.$guild.id}/users/${
					props.$.id
				}/avatars/${avatar()}.png?size=${props.size ?? 32}`}
			/>
		</Show>
	);
}

function UserAvatarGuild(props: AvatarProps & { guild: DiscordGuild }) {
	const profile = () => props.$.profiles.get(props.guild.id);

	return (
		<Show when={profile()} fallback={<UserAvatarGlobal $={props.$} size={props.size} />}>
			<UserAvatarProfile profile={profile()!} $={props.$} size={props.size} />
		</Show>
	);
}

export default function UserAvatar(
	props: AvatarProps & {
		guild?: DiscordGuild | null;
	}
) {
	return (
		<Switch fallback={<UserAvatarGlobal $={props.$} size={props.size} />}>
			{/* automatically use avatar global when webhook detected */}
			<Match when={props.$.value.bot && props.$.value.discriminator == "0000"}>
				<UserAvatarGlobal $={props.$} size={props.size} />
			</Match>
			<Match when={props.guild}>
				<UserAvatarGuild $={props.$} guild={props.guild!} size={props.size} />
			</Match>
		</Switch>
	);
}
