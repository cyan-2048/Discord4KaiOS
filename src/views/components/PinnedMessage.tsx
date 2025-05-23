import { DiscordGuild, DiscordMessage } from "discord";
import ActionMessage from "./ActionMessage";
import Pin from "../../icons/PinIcon.svg";
import { timeStamp } from "../Messages";
import * as styles from "./ActionMesage.module.scss";

export default function PinnedMessage(props: { $: DiscordMessage; guild?: DiscordGuild | null }) {
	return (
		<ActionMessage
			guild={props.guild}
			$={props.$.author}
			before={() => ""}
			after={() => (
				<>
					{" pinned a message to this channel. "}{" "}
					<small class={styles.date}>{timeStamp(props.$.$.timestamp)}</small>
				</>
			)}
			icon={() => <Pin />}
		/>
	);
}
