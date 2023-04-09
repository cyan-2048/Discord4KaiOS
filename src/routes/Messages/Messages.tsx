import { Markdown } from "@components/Markdown";
import "./style.scss";

import { currentChannel } from "@lib/shared";
import {
	scrollToBottom,
	setMapAndReturn,
	sleep,
	stringifyDate,
	useDestroy,
	useReadable,
} from "@lib/utils";
import DiscordMessage, { RawMessage } from "discord/Message";
import { ComponentChildren, JSX, h } from "preact";
import { memo, useEffect, useRef } from "preact/compat";
import clx from "obj-str";
import Mentions from "@/components/Mentions";
import { Guild } from "discord/Guilds";
import { User } from "discord/libs/types";
import handleActionMessage from "@/components/ActionMessages";

function timeDif(...args: Date[]) {
	const [dt2, dt1] = args.map((a) => +new Date(a));
	var diff = (dt2 - dt1) / 1000;
	diff /= 60;
	return Math.abs(Math.round(diff)) > 0;
}

function decideDateSeparator(...args: RawMessage[]) {
	return (
		new Set(args.map((a) => new Date(a?.timestamp).toLocaleDateString("en-us")))
			.size != 1
	);
}

function decideMessageSeparator(
	index: number,
	message: RawMessage,
	last_message?: RawMessage
) {
	return Boolean(
		decideDateSeparator(message, last_message) ||
			timeDif(last_message?.timestamp, message.timestamp) ||
			index == 0 ||
			last_message?.author.id != message.author?.id ||
			last_message?.type != message.type ||
			message.referenced_message ||
			message.interaction
	);
}

const MessageSeparator = memo(function MessageSeparator({
	children: { rawMessage: msg, guildInstance },
}: {
	children: DiscordMessage;
}) {
	const user = msg.author;
	const image = user.avatar
		? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpg?size=24`
		: null;

	return (
		<main class="MessageSeparator">
			<img src={image || "/css/default.png"} />
			<div class="name">
				<div class="user">
					<b>
						<Mentions
							guildInstance={guildInstance}
							mentions={false}
							type="user"
							username={user.username}
							id={user.id}
							prefix={false}
						/>
					</b>
				</div>
				{user.bot && (
					<div class="bot">
						{user.discriminator === "0000" ? "WEBHOOK" : "BOT"}
					</div>
				)}
				<div class="date">{stringifyDate(msg.timestamp)}</div>
			</div>
		</main>
	);
});

const MessageContent = memo(function MessageContent({
	children: message,
}: {
	children: DiscordMessage;
}) {
	const content = useReadable(message.content);
	return (
		<Markdown
			reference={{ guildInstance: message.guildInstance }}
			text={content}
			embed={!!message.rawMessage.author.bot}
		></Markdown>
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
		<div class="reply">
			<div class="r-icon" />
			<div class="r-text">
				<b>
					<Mentions
						guildInstance={guildInstance}
						mentions={false}
						type="user"
						username={user.username || null}
						id={user.id}
						prefix={false}
					/>{" "}
				</b>
				<span>
					<Markdown
						reference={{ guildInstance }}
						text={content}
						embed={embed}
					></Markdown>
				</span>
			</div>
		</div>
	);
});

/**
 * will return true if the emoji should be big or not
 * @param content the messageContent
 */
function testEmojiFont(content: RawMessage["content"]) {
	if (content === "") return false;

	function testString(string: string) {
		const filtered = Array.from(string).filter((a) => a !== " " && a !== "\n");

		// assume everything is emoji
		// if exceeds max then it is false
		if (filtered.length > 27) return false;

		// TODO: create a better emoji detection system
		/*
		return (
			filtered.every((a) => EmojiDict.search(a)) ||
			(string.includes("️") && EmojiDict.search(string))
		);
		*/
	}
	// const clone = element.cloneNode(true);
	//clone.querySelectorAll(".emoji").forEach((a) => {
	//	try {
	//		a.parentNode.replaceChild(document.createTextNode("💀"), a);
	//	} catch (e) {}
	//});
	//
	//testString(clone.innerText) && element.classList.add("emoji-big");
}

const Message = memo(function Message({
	message,
	separate,
	children,
}: {
	message: DiscordMessage;
	children?: ComponentChildren;
	separate: boolean;
}) {
	// const [focused, setFocused] = useState(false);
	const messageEl = useRef<HTMLDivElement>(null);
	const messageProps = useReadable(message.props);
	const deleted = useReadable(message.deleted);

	return (
		<div
			// onFocus={() => setFocused(true)}
			// onBlur={() =>
			// 	void (document.activeElement !== messageEl.current && setFocused(false))
			// }
			ref={messageEl}
			data-focusable=""
			tabIndex={0}
			class={clx({ Message: 1, mention: message.wouldPing(), deleted })}
			key={message.id}
		>
			{(messageProps.referenced_message || messageProps.interaction) && (
				<MessageReference
					content={
						messageProps.referenced_message
							? messageProps.referenced_message.content
							: `used [/${messageProps.interaction?.name}](https://www.youtube.com/watch?v=dQw4w9WgXcQ)`
					}
					embed={!!messageProps.interaction}
					guildInstance={message.guildInstance}
					user={
						messageProps.referenced_message?.author ||
						messageProps.interaction?.user
					}
				></MessageReference>
			)}
			{separate && <MessageSeparator>{message}</MessageSeparator>}
			{children}
			<div class={clx({ content: 1, edited: messageProps.edited_timestamp })}>
				<MessageContent>{message}</MessageContent>
			</div>
		</div>
	);
});

export default memo(function Messages({
	hidden,
	channelID,
}: {
	hidden: boolean;
	channelID: string;
}) {
	const handler = currentChannel.value?.messages;
	if (!handler) return;

	//handler.removeMessages = false;

	const chatboxEl = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// scroll chatbox to bottom
		sleep(20).then(() => scrollToBottom(chatboxEl.current));
	}, [handler]);

	const cachedMessages = useRef(new Map<string, JSX.Element>());

	const messages = useReadable(handler.state);

	useDestroy(() => {
		cachedMessages.current.clear();
	});

	return (
		<main class="Messages" style={{ visibility: hidden ? "hidden" : null }}>
			<div ref={chatboxEl} class="chatbox">
				{messages.map(
					(message, index, arr) =>
						cachedMessages.current.get(message.id) ||
						setMapAndReturn(
							cachedMessages.current,
							message.id,
							handleActionMessage(message) || (
								<Message
									separate={decideMessageSeparator(
										index,
										message.rawMessage,
										arr[index - 1]?.rawMessage
									)}
									message={message}
								></Message>
							)
						)
				)}
			</div>
		</main>
	);
});