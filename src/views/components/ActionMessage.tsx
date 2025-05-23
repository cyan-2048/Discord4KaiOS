import { DiscordGuild, DiscordUser } from "discord";
import UserLabel from "./UserLabel";
import * as styles from "./ActionMesage.module.scss";
import { JSXElement } from "solid-js";
import { Dynamic } from "solid-js/web";

export default function ActionMessage(props: {
	color?: string;
	icon: () => JSXElement;
	before?: () => JSXElement;
	after?: () => JSXElement;
	$: DiscordUser;
	guild?: DiscordGuild | null;
}) {
	return (
		<div class={styles.main}>
			<div class={styles.icon} style={{ color: props.color }}>
				<Dynamic component={props.icon} />
			</div>
			<div>
				<Dynamic component={props.before} />
				<span class={styles.user}>
					<UserLabel nickname color $={props.$} guild={props.guild} />
				</span>
				<Dynamic component={props.after} />
			</div>
		</div>
	);
}
