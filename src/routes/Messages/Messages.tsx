import { Markdown } from "@components/Markdown";
import "./style.scss";

import { currentChannel } from "@lib/shared";
import { scrollToBottom, sleep, useMount, useReadable } from "@lib/utils";
import { ChannelBase } from "discord/GuildChannels";
import DiscordMessage from "discord/Message";
import { get } from "discord/main";
import { Fragment, JSX, h } from "preact";
import {
	memo,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "preact/compat";
import clx from "obj-str";
import Mentions from "@/components/Mentions";
import { Guild } from "discord/Guilds";
import { User } from "discord/libs/types";
import { GuildMember } from "discord/GuildMembers";
import handleActionMessage from "@/components/ActionMessages";

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
		></Markdown>
	);
});

function setMapAndReturn<K, V>(map: Map<K, V>, key: K, value: V) {
	map.set(key, value);
	return value;
}

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
					{/*<MessageContent ></MessageContent>
					>{" "}
					
					{/*<MessageContent ></MessageContent>
					{#if message.referenced_message}
						<MessageContent {roles} {guildID} content={ref.content} />
					{:else}
						<MessageContent options={{ embed: true }} content="used [/{ref.name}](https://www.youtube.com/watch?v=dQw4w9WgXcQ)" />
					{/if}
*/}
				</span>
			</div>
		</div>
	);
});

const Message = memo(function ({ message }: { message: DiscordMessage }) {
	// const [focused, setFocused] = useState(false);
	const messageEl = useRef<HTMLDivElement>(null);
	const messageProps = useReadable(message.props);

	return (
		<div
			// onFocus={() => setFocused(true)}
			// onBlur={() =>
			// 	void (document.activeElement !== messageEl.current && setFocused(false))
			// }
			ref={messageEl}
			data-focusable=""
			tabIndex={0}
			class={clx({ Message: 1, mention: message.wouldPing() })}
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
	const messageHandler = currentChannel.value?.messages;
	if (!messageHandler) return;

	const chatboxEl = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// scroll chatbox to bottom
		sleep(20).then(() => scrollToBottom(chatboxEl.current));
	}, [messageHandler]);

	const messagesElementsCached = useRef(new Map<string, JSX.Element>());

	const messages = useReadable(messageHandler.state);

	return (
		<main class="Messages" style={{ visibility: hidden ? "hidden" : null }}>
			<div ref={chatboxEl} class="chatbox">
				{messages.map((message) => {
					console.log(message.rawMessage.type);
					return (
						messagesElementsCached.current.get(message.id) ||
						setMapAndReturn(
							messagesElementsCached.current,
							message.id,
							handleActionMessage(message) || (
								<Message message={message}></Message>
							)
						)
					);
				})}
			</div>
		</main>
	);
});
