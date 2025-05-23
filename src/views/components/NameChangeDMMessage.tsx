import { DiscordMessage } from "discord";
import { timeStamp } from "../Messages";
import ActionMessage from "./ActionMessage";
import * as styles from "./ActionMesage.module.scss";
import { Show } from "solid-js";
import UserLabel from "./UserLabel";

export default function NameChangeDMMessage(props: { $: DiscordMessage<any> }) {
	return (
		<ActionMessage
			$={props.$.author}
			icon={() => (
				<svg height="18" width="18" xmlns="http://www.w3.org/2000/svg">
					<g fill="none" fill-rule="evenodd">
						<path
							d="m0 14.25v3.75h3.75l11.06-11.06-3.75-3.75zm17.71-10.21c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75z"
							fill="#99aab5"
						/>
						<path d="m0 0h18v18h-18" />
					</g>
				</svg>
			)}
			after={() => (
				<>
					{" changed the name to: "}
					<span style="font-weight:700">{props.$.$.content}</span>{" "}
					<small class={styles.date}>{timeStamp(props.$.$.timestamp)}</small>
				</>
			)}
		/>
	);
}
