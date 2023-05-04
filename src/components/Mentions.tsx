import { discordInstance } from "@shared";
import { Guild } from "discord/Guilds";
import { JSX, createEffect } from "solid-js";
import { decimal2rgb, clx } from "@utils";
import { GuildMember } from "discord/GuildMembers";
import { createSignal, mergeProps } from "solid-js";

interface MentionsProps {
	type: string;
	id: string;
	guildInstance?: Guild;
	prefix?: boolean;
	mentions?: boolean;
	username?: string;
}

function prefi(s: string, prefix: boolean) {
	return prefix ? s : "";
}

function getGateway() {
	return discordInstance().gateway;
}

async function getProfile(
	id: string,
	prefix: boolean,
	setText: (text: string) => void,
	setStyle: (style: JSX.CSSProperties | null) => void,
	guildInstance?: Guild
) {
	const profile = guildInstance?.members.get(id) || getGateway().users_cache.get(id);

	function setter(profile: any) {
		const raw = profile.rawProfile || profile;
		setText(prefi("@", prefix) + (raw.nick || raw.user?.username || raw.username || ""));

		if (profile instanceof GuildMember) {
			const color = profile.getColor();
			color &&
				setStyle({
					color: `rgb(${profile.getColor()})`,
				});
		}
	}

	if (!profile) setText("");
	else setter(profile);

	// @ts-ignore
	if (guildInstance && !profile?.rawProfile) {
		const lazy = await guildInstance.members.lazy(id);
		const color = lazy.getColor();
		console.log(
			"LAZY %c" + (lazy.rawProfile.nick || lazy.rawProfile.user?.username),
			`color:${color ? `rgb(${color})` : "white"};`
		);
		if (lazy) setter(lazy);
	}
}

function Mentions(props: MentionsProps) {
	const { type, id, guildInstance, prefix, mentions, username } = mergeProps(
		{ prefix: true, mentions: true, username: "loading..." },
		props
	);
	const discordGateway = getGateway();
	const me = id === discordGateway.user?.id;

	const [text, setText] = createSignal("");
	const [style, setStyle] = createSignal<JSX.CSSProperties | null>(null);

	createEffect(() => {
		const type = props.type,
			id = props.id;
		if (type === "role") {
			const role = guildInstance?.rawGuild.roles?.find((e) => e.id === id);
			if (role && role.color > 0) {
				const rgb = decimal2rgb(role.color, true);
				setStyle({
					color: `rgb(${rgb})`,
					backgroundColor: `rgba(${rgb},0.3)`,
				});
			}
			setText(prefi("@", prefix) + (role?.name || "deleted-role"));
		} else if (type === "user") {
			getProfile(id, prefix, setText, setStyle, guildInstance);
		} else if (type === "channel") {
			const channel = discordGateway.findChannelByID(id);
			if (!channel) return setText("deleted-channel");
			if ("name" in channel) setText(prefi("#", prefix) + channel.name);
		}
	});

	return (
		<span classList={{ me, mentions }} style={style()}>
			{text() || username}
		</span>
	);
}

export default Mentions;
