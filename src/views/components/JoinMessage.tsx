import { DiscordGuild, DiscordMessage, DiscordUser } from "discord";
import ActionMessage from "./ActionMessage";
import * as styles from "./ActionMesage.module.scss";
import { timeStamp } from "../Messages";
import { createMemo } from "solid-js";

const greetings = [
	" joined the party.",
	" is here.",
	["Welcome, ", ". We hope you brought pizza."],
	["A wild ", " appeared."],
	" just landed.",
	" just slid into the server.",
	" just showed up!",
	["Welcome ", ". Say hi!"],
	" hopped into the server.",
	["Everyone welcome ", "!"],
	["Glad you're here, ", "."],
	["Good to see you, ", "."],
	["Yay you made it, ", "!"],
];

export default function JoinMessage(props: { $: DiscordMessage; guild: DiscordGuild }) {
	const greeting = createMemo(() => {
		let before = "",
			after = "";

		// console.log(props.$.$.timestamp);

		const greet = greetings[Number(new Date(props.$.$.timestamp)) % greetings.length];
		if (typeof greet == "string") {
			after = greet;
		} else {
			[before, after] = greet;
		}

		return [before, after];
	});

	const before = () => greeting()[0];
	const after = () => greeting()[1];

	return (
		<ActionMessage
			$={props.$.author}
			guild={props.guild}
			icon={() => (
				<svg height="18" width="18" xmlns="http://www.w3.org/2000/svg">
					<g fill="none" fill-rule="evenodd">
						<path d="m18 0h-18v18h18z" />
						<path d="m0 8h14.2l-3.6-3.6 1.4-1.4 6 6-6 6-1.4-1.4 3.6-3.6h-14.2" fill="#3ba55c" />
					</g>
				</svg>
			)}
			before={() => before()}
			after={() => (
				<>
					{after()} {<small class={styles.date}>{timeStamp(props.$.$.timestamp)}</small>}
				</>
			)}
		/>
	);
}
