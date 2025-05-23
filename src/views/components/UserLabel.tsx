import { DiscordUser, DiscordGuild, DiscordServerProfile } from "discord";
import { decimal2rgb, useStore } from "../../lib/utils";
import { Show } from "solid-js";

function UserLabelNicknameProfile(props: {
	$: DiscordUser;
	guild: DiscordGuild;
	profile: DiscordServerProfile;
	prefix?: string;
	color?: boolean;
}) {
	const nick = useStore(() => props.profile, "nick");
	const roles = useStore(() => props.profile, "roles");
	const guild_roles = useStore(() => props.guild, "roles");

	const role = () => {
		// i hope the compiler gets what i'm saying
		const _roles = roles();

		return guild_roles()
			.toSorted((a, b) => b.position - a.position)
			.find((a) => {
				return _roles.includes(a.id) && a.color !== 0;
			});
	};

	const color = () => role()?.color ?? null;

	const children = () => nick() ?? <UserLabelRelationshipNickname $={props.$} />;
	const prefix = props.prefix ?? "";

	return (
		<Show
			when={color()}
			fallback={
				<>
					{prefix}
					{children()}
				</>
			}
		>
			<span
				style={
					props.color ? { color: (color() && `rgb(${decimal2rgb(color()!, true)})`) || undefined } : undefined
				}
			>
				{prefix}
				{children()}
			</span>
		</Show>
	);
}

function UserLabelNicknameGuild(props: {
	$: DiscordUser;
	guild: DiscordGuild;
	prefix?: string;
	color: boolean;
}) {
	let profile = props.$.profiles.get(props.guild.id);

	if (!profile) {
		profile = props.$.profiles.insert(
			{
				user: props.$.$,
				roles: [],
				nick: null,
				mute: false,
				deaf: false,
				joined_at: "",
				flags: 1,
			},
			props.guild
		);
	}

	return <UserLabelNicknameProfile profile={profile} {...props} />;
}

function UserLabelRelationshipNickname(props: { $: DiscordUser; prefix?: string }) {
	const nick = useStore(() => props.$.relationship, "nickname");

	return (
		<>
			{props.prefix ?? ""}
			<Show when={nick()} fallback={<UserLabelGlobalName $={props.$} />}>
				{nick()}
			</Show>
		</>
	);
}

function UserLabelGlobalName(props: { $: DiscordUser; prefix?: string }) {
	const global_name = useStore(() => props.$, "global_name");
	const username = useStore(() => props.$, "username");

	return (
		<>
			{props.prefix ?? ""}
			{global_name() || username()}
		</>
	);
}

export default function UserLabel(props: {
	$: DiscordUser;
	nickname?: boolean;
	guild?: DiscordGuild | null;
	prefix?: string;
	color?: boolean;
}) {
	return (
		<Show when={props.$} fallback={"Error"}>
			<Show
				when={
					// if nickname and not a webhook
					props.nickname && !(props.$.value.bot && props.$.value.discriminator == "0000")
				}
				fallback={<UserLabelGlobalName prefix={props.prefix} $={props.$} />}
			>
				<Show when={props.guild} fallback={<UserLabelRelationshipNickname prefix={props.prefix} $={props.$} />}>
					<UserLabelNicknameGuild
						prefix={props.prefix}
						$={props.$}
						guild={props.guild!}
						color={props.color ?? false}
					/>
				</Show>
			</Show>
		</Show>
	);
}
