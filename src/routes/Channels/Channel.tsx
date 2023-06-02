import styles from "./Channel.module.scss";
import _channelStyles from "./Channels.module.scss";

import { useReadable } from "@/lib/hooks";
import { currentChannel } from "@/lib/shared";
import { clx, centerScroll, sleep } from "@/lib/utils";
import { useComputed } from "@preact/signals";
import { route } from "preact-router";
import { memo } from "preact/compat";
import { useCallback, useEffect, useState } from "preact/hooks";
import { GuildChannel } from "discord/GuildChannels";
import { Readable, get } from "discord/main";
import { guildID, focusedChannel } from "./shared";

interface ServerChannelProps {
	channel: GuildChannel;
	onFocus?: (e: FocusEvent) => void;
	onBlur?: () => void;
	class?: string;
	focused?: boolean;
	index?: number;
}

class AsyncCallbackRegistry {
	private asyncFunc?: () => Promise<any>;

	register<T = any>(func: () => Promise<T>, callback: (result: T) => void) {
		this.asyncFunc = func;
		func().then((a) => {
			if (this.asyncFunc === func) callback(a);
		});
	}
}

const switchingChannels = new AsyncCallbackRegistry();

function safeUseReadable(readable?: Readable<any>) {
	const [state, setState] = useState([]);

	useEffect(() => {
		if (!readable) return setState([]);
		setState([get(readable)]);
		return readable.subscribe((a) => setState([a]));
	}, [readable]);

	return state[0];
}

const ChannelIcons = {
	text: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
				d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z"
			/>
		</svg>
	),
	limited: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M14 8C14 7.44772 13.5523 7 13 7H9.76001L10.3657 3.58738C10.4201 3.28107 10.1845 3 9.87344 3H8.88907C8.64664 3 8.43914 3.17391 8.39677 3.41262L7.76001 7H4.18011C3.93722 7 3.72946 7.17456 3.68759 7.41381L3.51259 8.41381C3.45905 8.71977 3.69449 9 4.00511 9H7.41001L6.35001 15H2.77011C2.52722 15 2.31946 15.1746 2.27759 15.4138L2.10259 16.4138C2.04905 16.7198 2.28449 17 2.59511 17H6.00001L5.39427 20.4126C5.3399 20.7189 5.57547 21 5.88657 21H6.87094C7.11337 21 7.32088 20.8261 7.36325 20.5874L8.00001 17H14L13.3943 20.4126C13.3399 20.7189 13.5755 21 13.8866 21H14.8709C15.1134 21 15.3209 20.8261 15.3632 20.5874L16 17H19.5799C19.8228 17 20.0306 16.8254 20.0724 16.5862L20.2474 15.5862C20.301 15.2802 20.0655 15 19.7549 15H16.35L16.6758 13.1558C16.7823 12.5529 16.3186 12 15.7063 12C15.2286 12 14.8199 12.3429 14.7368 12.8133L14.3504 15H8.35045L9.41045 9H13C13.5523 9 14 8.55228 14 8Z"
			/>
			<path
				fill="currentColor"
				d="M21.025 5V4C21.025 2.88 20.05 2 19 2C17.95 2 17 2.88 17 4V5C16.4477 5 16 5.44772 16 6V9C16 9.55228 16.4477 10 17 10H19H21C21.5523 10 22 9.55228 22 9V5.975C22 5.43652 21.5635 5 21.025 5ZM20 5H18V4C18 3.42857 18.4667 3 19 3C19.5333 3 20 3.42857 20 4V5Z"
			/>
		</svg>
	),
	announce: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path d="M3.9 8.26H2V15.2941H3.9V8.26Z" fill="currentColor" />
			<path
				d="M19.1 4V5.12659L4.85 8.26447V18.1176C4.85 18.5496 5.1464 18.9252 5.5701 19.0315L9.3701 19.9727C9.4461 19.9906 9.524 20 9.6 20C9.89545 20 10.1776 19.8635 10.36 19.6235L12.7065 16.5242L19.1 17.9304V19.0588H21V4H19.1ZM9.2181 17.9944L6.75 17.3826V15.2113L10.6706 16.0753L9.2181 17.9944Z"
				fill="currentColor"
			/>
		</svg>
	),
};

/* For Channels in Servers aka not DMS */
const Channel = memo(({ channel, class: _class, index, focused = false, ..._props }: ServerChannelProps) => {
	const props = useReadable(channel.props);

	const readState = safeUseReadable(channel.readState);
	const unread = safeUseReadable(channel.unread);
	const muted = channel.isMuted();

	const mentions = readState?.mention_count || 0;

	const ch_type = props.type === 5 ? "announce" : channel.isPrivate() ? "limited" : "text";

	const switchChannel = useCallback(() => {
		switchingChannels.register(
			async () => {
				// @ts-ignore: idc
				if (channel.messages.messages.length < 15) await channel.messages.loadMessages();
			},
			() => {
				route(`/channels/${guildID.peek()}/${channel.id}`);
				channel.messages.ack();
				currentChannel.value = channel;
			}
		);
	}, [channel]);

	return (
		<main
			data-focusable=""
			data-index={index}
			tabIndex={0}
			id={`ch${channel.id}`}
			class={
				clx({
					[styles.Channel]: 1,
					[styles.muted]: muted && mentions == 0,
					[styles.unread]: (unread && !muted) || mentions > 0,
					// focused: useComputed(() => index === focusedChannel.value).value,
				}) + (_class ? " " + _class : "")
			}
			onFocus={async (e) => {
				if (e.target !== e.currentTarget) return;
				// focusedChannel.value = index;
				await sleep(10);
				await centerScroll(e.target as HTMLElement, false, {
					isScrollable(target: HTMLElement) {
						return target?.classList?.contains(_channelStyles.channels);
					},
				});
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter") switchChannel();
			}}
			onClick={switchChannel}
			{..._props}
		>
			<div class={styles.bar} />
			{ChannelIcons[ch_type as keyof typeof ChannelIcons]}
			{mentions > 0 && (
				<div class={styles.mentions}>
					<div class={String(mentions).length > 2 ? styles.flow : ""}>{mentions}</div>
				</div>
			)}
			<div class={styles.text}>{props.name}</div>
		</main>
	);
});

export default Channel;
