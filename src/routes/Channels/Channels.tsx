import { RouteProps } from "@lib/shared";
import { h } from "preact";

export default function Channels({ channelID, guildID, ...props }: RouteProps<{ channelID: string; guildID: string }>) {
	return (
		<main>
			HI you're on {channelID && "channelID:" + channelID} guildID:{guildID}
		</main>
	);
}
