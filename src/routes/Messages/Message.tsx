import { Markdown } from "@components/Markdown";
import Mentions from "@components/Mentions";
import { useReadable } from "@lib/hooks";
import { stringifyDate, clx } from "@lib/utils";
import { Guild } from "discord/Guilds";
import { User } from "discord/types";
import { ComponentChildren } from "preact";
import { memo } from "preact/compat";
import { useRef, useState } from "preact/hooks";
import DiscordMessage, { RawMessage } from "discord/Message";

import styles from "./Message.module.scss";

const MessageSeparator = memo(function MessageSeparator({ children: { rawMessage: msg, guildInstance } }: { children: DiscordMessage }) {
	const user = msg.author;
	const image = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpg?size=24` : null;

	return (
		<main class={styles.MessageSeparator}>
			<img src={image || "/css/default.png"} />
			<div class={styles.name}>
				<div class={styles.user}>
					<b>
						<Mentions guildInstance={guildInstance} mentions={false} type="user" username={user.username} id={user.id} prefix={false} />
					</b>
				</div>
				{user.bot && <div class={styles.bot}>{user.discriminator === "0000" ? "WEBHOOK" : "BOT"}</div>}
				<div class={styles.date}>{stringifyDate(msg.timestamp)}</div>
			</div>
		</main>
	);
});

const MessageContent = memo(function MessageContent({
	edited = false,
	children: message,
	setJumbo,
}: {
	edited?: boolean;
	children: DiscordMessage;
	setJumbo: (a: boolean) => void;
}) {
	const content = useReadable(message.content);
	return (
		<>
			<Markdown setJumbo={setJumbo} reference={{ guildInstance: message.guildInstance }} text={content} embed={!!message.rawMessage.author.bot}></Markdown>
			{}
		</>
	);
});

const MessageReference = memo(function MessageReference({
	guildInstance,
	user,
	content = "",
	embed = false,
}: {
	content: string;
	embed?: boolean;
	user: User;
	guildInstance: Guild;
}) {
	return (
		<div class={styles.reply}>
			<div class={styles["r-icon"]} />
			<div class={styles["r-text"]}>
				<b>
					<Mentions guildInstance={guildInstance} mentions={false} type="user" username={user.username || null} id={user.id} prefix={false} />{" "}
				</b>
				<span>
					<Markdown reference={{ guildInstance }} text={content} embed={embed}></Markdown>
				</span>
			</div>
		</div>
	);
});

export default function Message({ message, separate }: { message: DiscordMessage; children?: ComponentChildren; separate: boolean }) {
	// const [focused, setFocused] = useState(false);
	const messageEl = useRef<HTMLDivElement>(null);
	const messageProps = useReadable(message.props);
	const deleted = useReadable(message.deleted);

	const [emojiBig, setJumbo] = useState(false);

	return (
		<div
			// onFocus={() => setFocused(true)}
			// onBlur={() =>
			// 	void (document.activeElement !== messageEl.current && setFocused(false))
			// }
			ref={messageEl}
			data-focusable=""
			tabIndex={0}
			class={clx({ [styles.Message]: 1, [styles.mention]: message.wouldPing(), [styles.deleted]: deleted })}
		>
			{(messageProps.referenced_message || messageProps.interaction) && (
				<MessageReference
					content={
						messageProps.referenced_message ? messageProps.referenced_message.content : `used [/${messageProps.interaction?.name}](https://www.youtube.com/watch?v=dQw4w9WgXcQ)`
					}
					embed={!!messageProps.interaction}
					guildInstance={message.guildInstance}
					user={messageProps.referenced_message?.author || messageProps.interaction?.user}
				></MessageReference>
			)}
			{separate && <MessageSeparator>{message}</MessageSeparator>}

			<div class={clx({ [styles.content]: 1, [styles["emoji-big"]]: emojiBig, [styles.edited]: messageProps.edited_timestamp })}>
				<MessageContent setJumbo={setJumbo}>{message}</MessageContent>
			</div>
		</div>
	);
}
