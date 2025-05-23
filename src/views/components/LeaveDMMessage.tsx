import { DiscordMessage } from "discord";
import { timeStamp } from "../Messages";
import ActionMessage from "./ActionMessage";
import * as styles from "./ActionMesage.module.scss";
import { Show } from "solid-js";
import UserLabel from "./UserLabel";

export default function LeaveDMMessage(props: { $: DiscordMessage<any> }) {
	const mentionedUser = () =>
		props.$.$.mentions[0]?.id != props.$.author.id
			? props.$.$channel.$client.addUser(props.$.$.mentions[0])
			: null;

	return (
		<ActionMessage
			$={props.$.author}
			icon={() => (
				<svg height="18" width="18" xmlns="http://www.w3.org/2000/svg">
					<g fill="none" fill-rule="evenodd">
						<path d="m18 0h-18v18h18z" />
						<path d="m3.8 8 3.6-3.6-1.4-1.4-6 6 6 6 1.4-1.4-3.6-3.6h14.2v-2" fill="#ed4245" />
					</g>
				</svg>
			)}
			after={() => (
				<Show
					when={!mentionedUser()}
					fallback={
						<>
							{" removed "}
							<span class={styles.user}>
								<UserLabel $={mentionedUser()!} color nickname /> from the group.{" "}
							</span>
							<small class={styles.date}>{timeStamp(props.$.$.timestamp)}</small>
						</>
					}
				>
					{" "}
					left the group. <small class={styles.date}>{timeStamp(props.$.$.timestamp)}</small>
				</Show>
			)}
		/>
	);
}
