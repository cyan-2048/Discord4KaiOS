import { Markdown } from "@components/Markdown";
import "./style.scss";

import { currentChannel } from "@shared";
import { scrollToBottom, setMapAndReturn, sleep, stringifyDate, clx } from "@utils";
import { useDestroy, useReadable, useState, useEffect, useRef, useRefFunctional } from "@hooks";

import DiscordMessage, { RawMessage } from "discord/Message";
import { ComponentChildren, Fragment, JSX, h } from "preact";
import { memo, useCallback, useLayoutEffect } from "preact/compat";

import Mentions from "@components/Mentions";
import { Guild } from "discord/Guilds";
import { User } from "discord/types";
import handleActionMessage from "@components/ActionMessages";
import Button from "@/components/Button";

function timeDif(...args: Date[]) {
	const [dt2, dt1] = args.map((a) => +new Date(a));
	var diff = (dt2 - dt1) / 1000;
	diff /= 60;
	return Math.abs(Math.round(diff)) > 0;
}

function decideDateSeparator(...args: RawMessage[]) {
	return new Set(args.map((a) => new Date(a?.timestamp).toLocaleDateString("en-us"))).size != 1;
}

function decideMessageSeparator(index: number, message: RawMessage, last_message?: RawMessage) {
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

const MessageSeparator = memo(function MessageSeparator({ children: { rawMessage: msg, guildInstance } }: { children: DiscordMessage }) {
	const user = msg.author;
	const image = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpg?size=24` : null;

	return (
		<main class="MessageSeparator">
			<img src={image || "/css/default.png"} />
			<div class="name">
				<div class="user">
					<b>
						<Mentions guildInstance={guildInstance} mentions={false} type="user" username={user.username} id={user.id} prefix={false} />
					</b>
				</div>
				{user.bot && <div class="bot">{user.discriminator === "0000" ? "WEBHOOK" : "BOT"}</div>}
				<div class="date">{stringifyDate(msg.timestamp)}</div>
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
		<div class="reply">
			<div class="r-icon" />
			<div class="r-text">
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

function Message({ message, separate }: { message: DiscordMessage; children?: ComponentChildren; separate: boolean }) {
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
			class={clx({ Message: 1, mention: message.wouldPing(), deleted })}
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

			<div class={clx({ content: 1, "emoji-big": emojiBig, edited: messageProps.edited_timestamp })}>
				<MessageContent setJumbo={setJumbo}>{message}</MessageContent>
			</div>
		</div>
	);
}

const cachedMessages = new Map<string, JSX.Element>();

export default memo(function Messages({ hidden, channelID }: { hidden: boolean; channelID: string }) {
	const handler = currentChannel.value?.messages;
	if (!handler) return;

	//handler.removeMessages = false;

	const [chatboxEl, $, chatboxElRef] = useRefFunctional<HTMLDivElement>(null);

	useLayoutEffect(() => {
		// scroll chatbox to bottom
		sleep(20).then(() => scrollToBottom(chatboxEl()));
	}, [handler]);

	const messages = useReadable(handler.state);

	useDestroy(() => {
		cachedMessages.clear();
	});

	return (
		<main class="Messages" style={{ visibility: hidden ? "hidden" : null }}>
			<div ref={chatboxElRef} class="chatbox">
				<Button
					onClick={useCallback(async () => {
						await handler.loadMessages(4);
					}, [handler])}
				>
					Load More
				</Button>
				{messages.map((message, index, arr) => {
					return (
						cachedMessages.get(message.id) ||
						setMapAndReturn(
							cachedMessages,
							message.id,
							handleActionMessage(message) || (
								<Fragment key={"msg" + message.id}>
									<Message separate={decideMessageSeparator(index, message.rawMessage, arr[index - 1]?.rawMessage)} message={message}></Message>
								</Fragment>
							)
						)
					);
				})}
			</div>
		</main>
	);
});
