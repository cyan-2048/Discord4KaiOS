import { discordInstance } from "@shared";
import { Guild } from "discord/Guilds";
import { PureComponent } from "preact/compat";

import { h } from "preact";
import { decimal2rgb, clx } from "@utils";
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

function getGateway() {
	return discordInstance.peek().gateway;
}

export default class Mentions extends PureComponent<MentionsProps> {
	text: string;
	style: h.JSX.CSSProperties | null = null;
	discordGateway = getGateway();

	constructor(props) {
		super(props);

		this.layoutEffect();
	}

	async getProfile() {
		const { guildInstance, id, prefix = false } = this.props;

		const profile = guildInstance?.members.get(id) || getGateway().users_cache.get(id);

		const setter = (profile: any) => {
			const raw = profile.rawProfile || profile;
			this.text = prefi("@", prefix) + (raw.nick || raw.user?.username || raw.username || "");

			if (profile instanceof GuildMember) {
				const color = profile.getColor();
				color &&
					(this.style = {
						color: `rgb(${profile.getColor()})`,
					});
			}
		};

		if (!profile) this.text = "";
		else setter(profile);

		// @ts-ignore idk
		if (guildInstance && !profile?.rawProfile) {
			const lazy = await guildInstance.members.lazy(id);
			const color = lazy.getColor();
			console.log("LAZY %c" + (lazy.rawProfile.nick || lazy.rawProfile.user?.username), `color:${color ? `rgb(${color})` : "white"};`);
			if (lazy) setter(lazy);
			this.forceUpdate();
		}
	}

	layoutEffect() {
		const { type, guildInstance, id, prefix = true } = this.props;

		if (type === "role") {
			const role = guildInstance?.rawGuild.roles?.find((e) => e.id === id);
			if (role && role.color > 0) {
				const rgb = decimal2rgb(role.color, true);
				this.style = {
					color: `rgb(${rgb})`,
					backgroundColor: `rgba(${rgb},0.3)`,
				};
			}
			this.text = prefi("@", prefix) + (role?.name || "deleted-role");
		} else if (type === "user") {
			this.getProfile();
		} else if (type === "channel") {
			const channel = this.discordGateway.findChannelByID(id);
			if (!channel) {
				this.text = "deleted-channel";
				return;
			}
			if ("name" in channel) this.text = prefi("#", prefix) + channel.name;
		}
	}

	shouldComponentUpdate(nextProps: Readonly<MentionsProps>): boolean {
		const { type, id } = this.props;
		if (nextProps.type !== type || nextProps.id !== id) {
			this.layoutEffect();
			return true;
		}
		return false;
	}

	render({ id, mentions, username = "loading..." }: MentionsProps) {
		const me = id === this.discordGateway.user?.id;

		return (
			<span class={clx({ me, mentions })} style={this.style}>
				{this.text || username}
			</span>
		);
	}
}
