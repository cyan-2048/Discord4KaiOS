import { discordInstance } from "@/lib/shared";
import { Guild } from "discord/Guilds";
import { memo, useEffect, useState } from "preact/compat";
import clx from "obj-str";
import { Fragment, h } from "preact";
import { decimal2rgb } from "@lib/utils";
import { GuildMember } from "discord/GuildMembers";

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

async function getProfile(
	id: string,
	prefix: boolean,
	setText: (text: string) => void,
	setStyle: (style: h.JSX.CSSProperties | null) => void,
	guildInstance?: Guild
) {
	const profile =
		(await guildInstance?.getServerProfile(id)) ||
		discordInstance.peek().gateway.users_cache.get(id);
	if (!profile) setText(prefi("@", prefix) + "unknown-user");

	// @ts-ignore
	const raw = profile.rawProfile || profile;

	setText(
		prefi("@", prefix) +
			(raw.nick || raw.user?.username || raw.username || "unknown-user")
	);

	if (profile instanceof GuildMember)
		setStyle({
			color: `rgb(${profile.getColor()})`,
		});
}

export default memo(function Mentions({
	type,
	id,
	guildInstance,
	prefix = true,
	mentions = true,
	username = "loading...",
}: MentionsProps) {
	const discordGateway = discordInstance.peek().gateway;
	const me = id === discordGateway.user.id;

	const [text, setText] = useState("");
	const [style, setStyle] = useState<h.JSX.CSSProperties | null>(null);

	useEffect(() => {
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
	}, [type, id]);

	return (
		<span class={clx({ me, mentions })} style={style}>
			{text || username}
		</span>
	);
});
