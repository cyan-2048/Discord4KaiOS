import { Markdown } from "@components/Markdown";
import "./style.scss";

import { currentChannel } from "@lib/shared";
import { scrollToBottom, sleep, useMount, useReadable } from "@lib/utils";
import { ChannelBase } from "discord/GuildChannels";
import Message from "discord/Message";
import { get } from "discord/main";
import { Fragment, JSX, h } from "preact";
import { memo, useEffect, useLayoutEffect, useRef } from "preact/compat";

function MessageContent({ children: message }: { children: Message }) {
	const content = useReadable(message.content);
	return (
		<Markdown
			reference={{ guildInstance: message.guildInstance }}
			text={content}
		></Markdown>
	);
}

function setMapAndReturn<K, V>(map: Map<K, V>, key: K, value: V) {
	map.set(key, value);
	return value;
}

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
				{messages.map(
					(message) =>
						messagesElementsCached.current.get(message.id) ||
						setMapAndReturn(
							messagesElementsCached.current,
							message.id,
							<div key={message.id} class="Message">
								<MessageContent>{message}</MessageContent>
							</div>
						)
				)}
			</div>
		</main>
	);
});
