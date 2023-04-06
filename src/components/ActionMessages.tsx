import { Guild } from "discord/Guilds";
import "./assets/actions.scss";

import Message from "discord/Message";
import { User } from "discord/libs/types";
import { h } from "preact";
import { Fragment, memo } from "preact/compat";
import Mentions from "./Mentions";
import { stringifyDate, useMount } from "@/lib/utils";

interface ActionMessageBaseProps {
	icon?: h.JSX.Element | string;
	before?: h.JSX.Element | string;
	after?: h.JSX.Element | string;
	iconColor?: string;
	user: User;
	guildInstance?: Guild;
}

function ActionMessageBase({
	icon,
	before,
	after,
	iconColor = null,
	user,
	guildInstance,
}: ActionMessageBaseProps) {
	return (
		<main tabIndex={0} data-focusable="" className="ActionMessageBase">
			<div class="icon" style={{ color: iconColor }}>
				{icon}
			</div>
			<div>
				{before}
				<Mentions
					type="user"
					username={user.username}
					guildInstance={guildInstance}
					id={user.id}
					prefix={false}
					mentions={false}
				></Mentions>
				{after}
			</div>
		</main>
	);
}

const greetings = [
	["", " joined the party."],
	["", " is here."],
	["Welcome, ", ". We hope you brought pizza."],
	["A wild ", " appeared."],
	["", " just landed."],
	["", " just slid into the server."],
	["", " just showed up!"],
	["Welcome ", ". Say hi!"],
	["", " hopped into the server."],
	["Everyone welcome ", "!"],
	["Glad you're here, ", "."],
	["Good to see you, ", "."],
	["Yay you made it, ", "!"],
];

function getGreeting(snowflake: number) {
	return greetings[snowflake % greetings.length];
}

const ActionMessages = memo(function ActionMessages({
	children: _,
}: {
	children: Message;
}) {
	const msg = _.rawMessage;
	// @ts-ignore
	const snowflake = new Date(msg.timestamp) * 1;

	switch (msg.type) {
		case 6:
			return (
				<ActionMessageBase
					icon={
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M22 12L12.101 2.10101L10.686 3.51401L12.101 4.92901L7.15096 9.87801V9.88001L5.73596 8.46501L4.32196 9.88001L8.56496 14.122L2.90796 19.778L4.32196 21.192L9.97896 15.536L14.222 19.778L15.636 18.364L14.222 16.95L19.171 12H19.172L20.586 13.414L22 12Z"
							/>
						</svg>
					}
					user={msg.author}
					after={" pinned a message to this channel."}
					guildInstance={_.guildInstance}
				/>
			);
		case 8:
			return (
				<ActionMessageBase
					icon={
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 32 32"
						>
							<path
								fill="currentColor"
								fillRule="evenodd"
								clipRule="evenodd"
								d="M16.5 1.46002L24.62 9.58002L20.62 11.23L16.5 7.12002V1.46002ZM11 12.16L7 10.5V21.42L11 19.76V12.16ZM16.5 24.8001V30.4601L24.62 22.3401L20.62 20.6801L16.5 24.8001ZM15.5 7.12004V1.46004L7.38 9.58004L11.38 11.23L15.5 7.12004ZM15.5 30.46L7.38 22.34L11.38 20.68L15.5 24.8V30.46ZM21 19.76L25 21.42V10.5L21 12.16V19.76ZM16 8.03003L20 12.03V19.89L16 23.89L12 19.89V12.03L16 8.03003Z"
							/>
						</svg>
					}
					user={msg.author}
					iconColor="rgb(255, 115, 250)"
					after={" just boosted the server!"}
					guildInstance={_.guildInstance}
				/>
			);

		case 3:
			return (
				<ActionMessageBase
					icon={
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18">
							<path
								fill="#3ba55c"
								fill-rule="evenodd"
								d="M17.7163041 15.36645368c-.0190957.02699568-1.9039523 2.6680735-2.9957762 2.63320406-3.0676659-.09785935-6.6733809-3.07188394-9.15694343-5.548738C3.08002193 9.9740657.09772497 6.3791404 0 3.3061316v-.024746C0 2.2060575 2.61386252.3152347 2.64082114.2972376c.7110335-.4971705 1.4917101-.3149497 1.80959713.1372281.19320342.2744561 2.19712724 3.2811005 2.42290565 3.6489167.09884826.1608492.14714912.3554431.14714912.5702838 0 .2744561-.07975258.5770327-.23701117.8751101-.1527655.2902036-.65262318 1.1664385-.89862055 1.594995.2673396.3768148.94804468 1.26429792 2.351016 2.66357424 1.39173858 1.39027775 2.28923588 2.07641807 2.67002628 2.34187563.4302146-.2452108 1.3086162-.74238132 1.5972981-.89423205.5447887-.28682915 1.0907006-.31944893 1.4568885-.08661115.3459689.2182151 3.3383754 2.21027167 3.6225641 2.41611376.2695862.19234426.4144887.5399137.4144887.91672846 0 .2969525-.089862.61190215-.2808189.88523346"
							/>
						</svg>
					}
					iconColor="#3ba55c"
					user={msg.author}
					guildInstance={_.guildInstance}
					after={
						<>
							<span class="call_text">{" started a call."}</span>
							<span class="call_date">{stringifyDate(msg.timestamp)}</span>
						</>
					}
				/>
			);

		case 7:
			return (
				<ActionMessageBase
					icon={
						<svg height="18" width="18" xmlns="http://www.w3.org/2000/svg">
							<g fill="none" fill-rule="evenodd">
								<path d="m18 0h-18v18h18z" />
								<path
									d="m0 8h14.2l-3.6-3.6 1.4-1.4 6 6-6 6-1.4-1.4 3.6-3.6h-14.2"
									fill="#3ba55c"
								/>
							</g>
						</svg>
					}
					before={<span class="join_text">{getGreeting(snowflake)[0]}</span>}
					after={<span class="join_text">{getGreeting(snowflake)[1]}</span>}
					user={msg.author}
					guildInstance={_.guildInstance}
				/>
			);
	}

	return <></>;
});

export default function handleActionMessage(message: Message) {
	console.log("tESTs");
	return [6, 7, 8, 3].includes(message.rawMessage.type) ? (
		<ActionMessages>{message}</ActionMessages>
	) : null;
}
