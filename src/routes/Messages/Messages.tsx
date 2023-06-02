import styles from "./Messages.module.scss";

import { currentChannel } from "@shared";
import { scrollToBottom, setMapAndReturn, sleep } from "@utils";
import { useDestroy, useReadable, useRefFunctional } from "@hooks";

import { RawMessage } from "discord/Message";
import { Fragment, JSX } from "preact";
import { memo, useCallback, useLayoutEffect } from "preact/compat";

import handleActionMessage from "@components/ActionMessages";
import Button from "@components/Button";
import Message from "./Message";

function timeDif(...args: (Date | undefined)[]) {
	const [dt2, dt1] = args.map((a) => +new Date(a || 0));
	var diff = (dt2 - dt1) / 1000;
	diff /= 60;
	return Math.abs(Math.round(diff)) > 0;
}

function decideDateSeparator(...args: (RawMessage | undefined)[]) {
	return new Set(args.map((a) => new Date(a?.timestamp || 0).toLocaleDateString("en-us"))).size != 1;
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
		<main class={styles.Messages} style={{ visibility: hidden ? "hidden" : null }}>
			<div ref={chatboxElRef} class={styles.chatbox}>
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
