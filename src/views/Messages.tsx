import {
	$longpress,
	Views,
	currentDiscordChannel,
	currentDiscordGuild,
	currentForwardingMessage,
	currentView,
	disableDiscordLinkLabels,
	discordClientReady,
	preserveDeleted,
	setCurrentDiscordChannel,
	setCurrentDiscordGuild,
	setCurrentForwardMessage,
	setCurrentView,
	themeStyle,
} from "@/signals";

import * as mainViewStyles from "../MainView.module.scss";
import * as styles from "./Messages.module.scss";
import { Accessor, For, JSXElement, Match, Show, Switch, batch, createEffect, createSignal, lazy, onCleanup, onMount, untrack } from "solid-js";
import { DiscordDMChannel, DiscordGroupDMChannel, DiscordGuild, DiscordGuildTextChannel, DiscordMessage, DiscordUser, MessageReaction, WritableStore } from "discord";

import TextIcon from "../icons/TextIcon.svg";
import LockIcon from "../icons/LockIcon.svg";
import ChatIcon from "../icons/ChatIcon.svg";
import ChevronSmallRightIcon from "../icons/ChevronSmallRightIcon.svg";
import SettingsIcon from "../icons/SettingsIcon.svg";
import PinIcon from "../icons/PinIcon.svg";
import PencilIcon from "../icons/PencilIcon.svg";
import GifIcon from "../icons/GifIcon.svg";
const EmojiIcon = () => (
	<svg width="18" height="18" fill="none" viewBox="0 0 24 24">
		<path
			fill="currentColor"
			fill-rule="evenodd"
			d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22ZM6.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-9.8 1.17a1 1 0 0 1 1.39.27 3.5 3.5 0 0 0 5.82 0 1 1 0 0 1 1.66 1.12 5.5 5.5 0 0 1-9.14 0 1 1 0 0 1 .27-1.4Z"
			clip-rule="evenodd"
			class=""
		></path>
	</svg>
);

import { centerScroll, decimal2rgb, isInViewport, isKeypressPaused, isPartiallyInViewport, sleep, typeInTextarea, useKeypress, useStore } from "@/lib/utils";
import UserLabel from "./components/UserLabel";
import SpatialNavigation from "@/lib/spatial_navigation";
import dayjs from "dayjs";
import DateSeparator from "./components/DateSeparator";
import JoinMessage from "./components/JoinMessage";
import PinnedMessage from "./components/PinnedMessage";
import Markdown, { MarkdownNode, MarkdownProps, MarkdownRef, Renderer } from "./components/Markdown";
const EmojiPicker = lazy(() => import("./components/EmojiPicker"));

function toCodePoint(unicodeSurrogates: string, sep?: any) {
	var r = [],
		c = 0,
		p = 0,
		i = 0;
	while (i < unicodeSurrogates.length) {
		c = unicodeSurrogates.charCodeAt(i++);
		if (p) {
			r.push((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)).toString(16));
			p = 0;
		} else if (0xd800 <= c && c <= 0xdbff) {
			p = c;
		} else {
			r.push(c.toString(16));
		}
	}
	return r.join(sep || "-");
}

import { Dynamic } from "solid-js/web";
import ReplyBadge from "./components/ReplyBadge";
import UserAvatar from "./components/UserAvatar";
import MessageEmbeds, { FocusableLink, makeContentFocusable } from "./components/MessageEmbeds";
import Button from "./components/Button";
import debounce from "lodash-es/debounce";
import { toolshed } from "./modals/toolshed";
import { OptionsMenu } from "./components/OptionsMenu";
import { VoiceRecorderWeb } from "./components/VoiceRecorderWeb";
import { toast } from "./modals/toast";
import filePicker from "@/lib/filePicker";
import { fullscreen } from "./modals/fullscreen";
import Settings from "./Settings";
import { APIMessage } from "discord/src/lib/types";
import difference from "lodash-es/difference";
import { popup } from "./modals/popup";
import MessageReactionsPopup from "./components/MessageReactionsPopup";
import LeaveDMMessage from "./components/LeaveDMMessage";
import JoinDMMessage from "./components/JoinDMMessage";
import NameChangeDMMessage from "./components/NameChangeDMMessage";
import CallMessage from "./components/CallMessage";
import GifPicker from "./components/GifPicker";

type DiscordTextChannel = NonNullable<ReturnType<typeof currentDiscordChannel>>;
type AttachmentToUpload = NonNullable<SendMessageArgs[2]>[number];

const [messageBoxHeight, setMessageBoxHeight] = createSignal(34);
const [messageBoxFocusable, setMessageBoxFocusable] = createSignal(true);
const [messageBoxFocused, setMessageBoxFocused] = createSignal(false);
const [readonlyChannel, setReadonlyChannel] = createSignal(false);
const [isLoadingMoreMessages, setIsLoadingMoreMessages] = createSignal(false);

let shouldScrollToBottom = (_addHeight?: number) => false;
let scrollToBottom = (_smooth?: boolean) => {};

const [lastFocused, setLastFocused] = createSignal("message-box");

const [attachments, setAttachments] = createSignal<AttachmentToUpload[]>([]);

const [currentEditingMessage, setCurrentEditingMessage] = createSignal<DiscordMessageType | null>(null);
const [currentReplyingMessage, setCurrentReplyingMessage] = createSignal<DiscordMessageType | null>(null);
/**
 * returns true if there's an obvious time difference between the two dates
 */
function timeDiff(d2: string, d1: string) {
	const dt2 = new Date(d2);
	const dt1 = new Date(d1);
	var diff = (dt2.getTime() - dt1.getTime()) / 1000;
	diff /= 60;
	return Math.abs(Math.round(diff)) > 0;
}

export function timeStamp(date: string) {
	const day = dayjs(date),
		midnight = dayjs(dayjs(date).format("YYYY-MM-DD")),
		today = dayjs(dayjs().format("YYYY-MM-DD"));

	const dayDiff = today.diff(midnight, "day");

	const americans = day.toDate().toLocaleTimeString(navigator.language, {
		minute: "numeric",
		hour: "numeric",
	});

	if (dayDiff == 0) {
		return "Today at " + americans;
	} else if (Math.abs(dayDiff) == 1) {
		return "Yesterday at " + americans;
	}

	const americans2 = day.toDate().toLocaleDateString(navigator.language);

	return americans2 + " " + americans;
}

/**
 * returns true if the dates are different (year, month, day)
 */
function decideDateSeparator(...args: string[]) {
	// it not enough args, then you should probably add a separator
	if (args.filter((a) => Boolean(a)).length < 2) return true;
	const dates = args.map((a) => dayjs(dayjs(a).format("YYYY-MM-DD")));
	const first = dates.shift()!;

	return Boolean(dates.find((a) => first.diff(a, "day") != 0));
}

function decideMessageSeparator(message: DiscordMessageType, before: DiscordMessageType | undefined, channel: ValidChannel) {
	const last_message = before;
	if (!last_message) return true;

	return Boolean(
		decideDateSeparator(message.$.timestamp, last_message.$.timestamp) ||
			timeDiff(last_message.$.timestamp, message.$.timestamp) ||
			last_message.$.type != message.$.type ||
			last_message.author.id != message.author.id ||
			message.$.referenced_message ||
			message.$.interaction
	);
}

function replyToMessage(message: DiscordMessageType) {
	if (!message.isRepliable()) return;

	batch(() => {
		setCurrentReplyingMessage(message);
		setCurrentEditingMessage(null);
	});

	sleep(10).then(() => {
		SpatialNavigation.focus("message-box");
	});
}

function editMessage(message: DiscordMessageType) {
	if (!message.isEditable()) return;

	batch(() => {
		setCurrentEditingMessage(message);
		if (textarea) {
			textarea.value = message.value.content;
			textarea.dispatchEvent(new Event("input", { bubbles: true }));
		}
		setCurrentReplyingMessage(null);
	});

	sleep(10).then(() => {
		SpatialNavigation.focus("message-box");
	});
}

async function jumpToBottom() {
	scrollToBottom(true);
	await sleep(300);
	(chatbox?.lastChild as HTMLElement)?.focus();
	await tick();
	if (!untrack(readonlyChannel)) SpatialNavigation.focus("message-box");
}

function mentionUserFromMessage(message: DiscordMessageType) {
	if (!textarea) return;

	SpatialNavigation.focus("message-box");
	typeInTextarea("@" + message.author.$.username + " ", textarea);
}

function ReactionButton(props: { $: MessageReaction }) {
	const me = useStore(props.$, "me");
	const emoji = useStore(props.$, "emoji");
	const count = useStore(props.$, "count");

	return (
		<FocusableLink
			onNavigate={() => {
				props.$.toggle();
			}}
			react={
				<div
					classList={{
						[styles.reactionButton]: true,
						[styles.me]: me(),
					}}
				>
					<Show
						when={emoji().id}
						fallback={
							<div
							// class={styles.unicode}
							>
								{emoji().name}
							</div>
						}
					>
						<div class={styles.non_uni}>
							<img src={`https://cdn.discordapp.com/emojis/${emoji().id}.${emoji().animated ? "gif" : "png"}?size=16`} alt={emoji().name!} />
						</div>
					</Show>
					<div class={styles.num}>{count()}</div>
				</div>
			}
		/>
	);
}

function MessageReactions(props: { $: MessageReaction[] }) {
	return (
		<div class={styles.reactions}>
			<For each={props.$}>{(a) => <ReactionButton $={a} />}</For>
		</div>
	);
}

function ChannelTypingIndicatorWithChannel(props: { channel: DiscordTextChannel }) {
	const user_id = () => props.channel.$client.config.user_id!;

	const typingStateRaw = useStore(() => props.channel.typingState);

	const typingState = () => typingStateRaw().filter((a) => a?.id != user_id());

	return (
		<Show when={typingState().length}>
			<div class={styles.typing}>
				<Show when={typingState().length < 5} fallback={"Several people are typing..."}>
					<For each={typingState()}>
						{(a, i) => (
							<>
								<span class={styles.user}>
									<UserLabel $={a} nickname guild={currentDiscordGuild()} />
								</span>
								<Show when={i() < typingState().length - 2} fallback={<Show when={typingState().length > 1 && i() == typingState().length - 2}>{" and "}</Show>}>
									{", "}
								</Show>
							</>
						)}
					</For>{" "}
					{typingState().length > 1 ? "are" : "is"} typing
				</Show>
			</div>
		</Show>
	);
}

function ChannelTypingIndicator() {
	return (
		<Show when={currentDiscordChannel()}>
			<ChannelTypingIndicatorWithChannel channel={currentDiscordChannel()!} />
		</Show>
	);
}

function MessageBoxInteraction() {
	const _replying = currentReplyingMessage;
	const _editing = currentEditingMessage;

	const interacting = () => {
		const _r = _replying();
		const _e = _editing();
		return _r || _e;
	};
	const guild = currentDiscordGuild;
	const channel = currentDiscordChannel;

	createEffect(() => {
		const _channel = channel(),
			_interacting = interacting();

		if (!_interacting) return;

		if (_interacting.$channel != _channel) {
			batch(() => {
				setCurrentReplyingMessage(null);
				setCurrentEditingMessage(null);
			});
		}
	});

	const isEditing = () => _editing() == interacting();

	return (
		<Show when={interacting()}>
			<Show when={isEditing()} fallback={<div class={styles.interaction}>Replying to {<UserLabel color nickname guild={guild()} $={interacting()!.author} />}</div>}>
				<div class={styles.interaction}>Editing Message</div>
			</Show>
		</Show>
	);
}

function MessageBoxHeader() {
	return (
		<div class={styles.header}>
			<ChannelTypingIndicator />
			<MessageBoxInteraction />
		</div>
	);
}

function PlaceholderRecipients(props: { currentUser: DiscordUser; channel: Extract<DiscordTextChannel, { recipients: any }> }) {
	const recipients = useStore(() => props.channel.recipients);

	return (
		<>
			{recipients().length <= 2 ? "@" : ""}
			{recipients().length == 1 ? (
				<UserLabel nickname $={recipients()[0]} />
			) : (
				<For each={recipients().filter((a) => a != props.currentUser)}>
					{(a, i) => (
						<>
							{i() > 0 && ", "}
							<UserLabel nickname $={a} />
						</>
					)}
				</For>
			)}
		</>
	);
}

function PlaceholderName() {
	const channel = () => currentDiscordChannel()!;

	const client = () => channel().$client;
	const currentUser = () => client().users.get(client().ready.user.id)!;

	const channelValue: Accessor<ReturnType<typeof channel>["value"]> = useStore(() => channel() as any);

	return (
		<Switch>
			<Match when={"name" in channelValue() && (channelValue() as any).name}>
				{"recipients" in channel() ? "" : "#"}
				{(channelValue() as Extract<ReturnType<typeof channelValue>, { name: any }>).name}
			</Match>
			<Match when={"recipients" in channel()}>
				<PlaceholderRecipients channel={channel() as any} currentUser={currentUser()} />
			</Match>
		</Switch>
	);
}

let textarea: HTMLTextAreaElement | null = null;

type SendMessageArgs = Parameters<NonNullable<ReturnType<typeof currentDiscordChannel>>["sendMessage"]>;

function sendMessage(content: string, opts?: SendMessageArgs[1], attachments?: SendMessageArgs[2]) {
	const channel = currentDiscordChannel();
	if (!channel) return;
	const res = channel.sendMessage(content, opts, attachments);

	if ("response" in res) {
		res.response().catch(() => {
			alert("message was not sent!!");
		});
	} else {
	}
}

function MessageBoxWithChannel(props: { $: DiscordTextChannel }) {
	const currentChannel = () => props.$;

	let hiddenDiv!: HTMLDivElement;
	let messageTextAreaRef!: HTMLTextAreaElement;

	const [value, setValue] = createSignal("");

	createEffect(() => {
		value();
		if (!hiddenDiv) return;
		const height = hiddenDiv.offsetHeight;
		setMessageBoxHeight(height);
	});

	onMount(() => {
		textarea = messageTextAreaRef;
	});

	onCleanup(() => {
		textarea = null;
	});

	const focused = () => messageBoxFocused();

	createEffect(() => {
		setMessageBoxFocusable(currentView() == Views.MESSAGES);
	});

	const disabled = () => !messageBoxFocusable();

	/**
	 * returns true if the keyboard is usable, keyboard can only be used if
	 * - messagebox allows
	 */
	function canUseKeyboard() {
		if (untrack(isKeypressPaused)) return false;

		// if messageTextArea doesn't even exist just return true
		if (!messageTextAreaRef) return true;

		if (messageTextAreaRef !== document.activeElement || messageTextAreaRef.value == "" || messageTextAreaRef.selectionStart == 0) return true;

		return false;
	}

	createEffect(() => {
		const isDisabled = disabled();

		if (isDisabled && document.activeElement == messageTextAreaRef) {
			messageTextAreaRef.blur();
		}
	});

	return (
		<div class={styles.MessageBox}>
			<MessageBoxHeader />
			<div class={styles.texbox_wrap} style={{ height: messageBoxHeight() + "px" }}>
				<textarea
					ref={messageTextAreaRef}
					style={{ height: messageBoxHeight() + "px" }}
					disabled={disabled()}
					onInput={async (e) => {
						await sleep(0);
						setValue(e.target.value);
						untrack(currentChannel).typingState.debounce();
					}}
					onFocus={(e) => {
						if (e.currentTarget !== e.target) return;

						chatbox?.scrollBy({
							top: 22,
							behavior: "smooth",
						});

						setMessageBoxFocused(true);
						setLastFocused("message-box");
					}}
					on:sn-unfocused={async (e) => {
						if (e.currentTarget !== e.target) return;
						console.log("SNUNFOCUSED", e.detail.native);
						const native = e.detail.native;

						if (native) return;
						setMessageBoxFocused(false);
					}}
					onKeyDown={async (e) => {
						if (e.currentTarget !== e.target) return;

						if (e.key.includes("Arrow")) {
							if (e.key == "ArrowUp" && canUseKeyboard()) return;
							e.stopImmediatePropagation();
							e.stopPropagation();
						}

						if (untrack(isKeypressPaused)) return;

						const editing = untrack(currentEditingMessage);
						const replying = untrack(currentReplyingMessage);
						const forwarding = untrack(currentForwardingMessage);

						const interacting = editing || replying;

						// TODO SOFTRIGHT BEHAVIOR

						const _attachments = attachments();

						const softLeftOccupied = untrack(value) || (!editing && _attachments.length);

						if (e.key == "SoftLeft" && softLeftOccupied) {
							console.log("bitch");

							if (replying) {
								// currentReplyingMessage.value = null;
								setCurrentReplyingMessage(null);
							}

							const _content = untrack(value).replace(/@([a-z0-9_\.]{2,32})(\s|$)/g, (a, found_username) => {
								// since negative lookahead isn't possible on KaiOS 2.5,
								// we will manually check for reoccuring dots
								if (a.includes("..")) return a;

								// TODO: actual user picker

								let foundUser: DiscordUser | null = null as any as DiscordUser;

								// username was found from the messages in the channel
								currentChannel()?.messages.state.value?.find((a) => {
									return a.author.value.username == found_username && (foundUser = a.author);
								});

								if (foundUser) {
									return a.replace("@" + found_username, `<@${foundUser.id}>`);
								}

								return a;
							});

							if (editing) {
								editing.edit(_content);
								setCurrentEditingMessage(null);
							} else {
								sendMessage(
									_content,
									{
										message_reference: replying
											? {
													message_id: replying.id,
													channel_id: replying.$channel.id,
											  }
											: undefined,
									},
									_attachments
								);
								if (_attachments.length) setAttachments([]);
							}

							setValue("");
							(e.target as HTMLTextAreaElement).value = "";
						}

						if ((["ArrowLeft", "Backspace"].includes(e.key) && canUseKeyboard()) || (e.key == "SoftLeft" && !softLeftOccupied && canUseKeyboard())) {
							setCurrentView(Views.CHANNELS);
							await sleep(0);
							SpatialNavigation.focus("channels");
						}

						if (e.key == "SoftRight") {
							const actEl = e.currentTarget;
							actEl?.blur();

							const close = toolshed(() => (
								<OptionsMenu
									items={[
										interacting && {
											id: "interaction",
											text: "Cancel " + (editing ? "Editing" : "Replying"),
										},
										forwarding && {
											id: "forward",
											text: "Forward Here",
											icon: () => (
												<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
													<path
														fill="currentColor"
														d="M21.7 7.3a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4-1.4L18.58 9H13a7 7 0 0 0-7 7v4a1 1 0 1 1-2 0v-4a9 9 0 0 1 9-9h5.59l-3.3-3.3a1 1 0 0 1 1.42-1.4l5 5Z"
														class=""
													></path>
												</svg>
											),
										},

										!editing && {
											id: "upload",
											text: "Upload a File",
											icon: () => (
												<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
													<path
														fill="currentColor"
														d="M13.82 21.7c.17.05.14.3-.04.3H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h7.5c.28 0 .5.22.5.5V5a5 5 0 0 0 5 5h2.5c.28 0 .5.22.5.5v2.3a.4.4 0 0 1-.68.27l-.2-.2a3 3 0 0 0-4.24 0l-4 4a3 3 0 0 0 0 4.25c.3.3.6.46.94.58Z"
														class=""
													></path>
													<path
														fill="currentColor"
														d="M21.66 8c.03 0 .05-.03.04-.06a3 3 0 0 0-.58-.82l-4.24-4.24a3 3 0 0 0-.82-.58.04.04 0 0 0-.06.04V5a3 3 0 0 0 3 3h2.66ZM18.3 14.3a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1-1.4 1.4L20 17.42V23a1 1 0 1 1-2 0v-5.59l-2.3 2.3a1 1 0 0 1-1.4-1.42l4-4Z"
														class=""
													></path>
												</svg>
											),
										},
										!editing
											? untrack(attachments).length
												? { id: "delete-uploads", text: `Delete ${untrack(attachments).length} attachments` }
												: {
														id: "voice-message",
														text: "Send a voice message",
														icon: () => (
															<svg width="18" height="18" viewBox="0 0 24 24">
																<path
																	fill-rule="evenodd"
																	clip-rule="evenodd"
																	d="M14.99 11C14.99 12.66 13.66 14 12 14C10.34 14 9 12.66 9 11V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5L14.99 11ZM12 16.1C14.76 16.1 17.3 14 17.3 11H19C19 14.42 16.28 17.24 13 17.72V21H11V17.72C7.72 17.23 5 14.41 5 11H6.7C6.7 14 9.24 16.1 12 16.1ZM12 4C11.2 4 11 4.66667 11 5V11C11 11.3333 11.2 12 12 12C12.8 12 13 11.3333 13 11V5C13 4.66667 12.8 4 12 4Z"
																	fill="currentColor"
																></path>
																<path
																	fill-rule="evenodd"
																	clip-rule="evenodd"
																	d="M14.99 11C14.99 12.66 13.66 14 12 14C10.34 14 9 12.66 9 11V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5L14.99 11ZM12 16.1C14.76 16.1 17.3 14 17.3 11H19C19 14.42 16.28 17.24 13 17.72V22H11V17.72C7.72 17.23 5 14.41 5 11H6.7C6.7 14 9.24 16.1 12 16.1Z"
																	fill="currentColor"
																></path>
															</svg>
														),
												  }
											: null,
										{
											id: "emoji",
											text: "Emoji",
											icon: () => <EmojiIcon />,
										},
										{ id: "gif", text: "GIF", icon: () => <GifIcon /> },
										{
											id: "settings",
											text: "Settings",
											icon: () => <SettingsIcon />,
										},
									]}
									onSelect={async (a) => {
										await close?.();

										if (a === null) {
											actEl.focus();
											return;
										}

										switch (a) {
											case "forward": {
												sendMessage(
													"",
													{
														message_reference: {
															type: 1,
															...(forwarding as any),
														},
													},
													[]
												);
												setCurrentForwardMessage(null);
												break;
											}

											case "voice-message": {
												let voice_message = null as {
													blob: Blob;
													waveform: string;
													duration_secs: number;
												} | null;

												const close = toolshed(() => (
													<VoiceRecorderWeb
														setAudioBlob={(blob, waveform, duration) => {
															voice_message = { blob, waveform, duration_secs: duration };
														}}
														onSend={async () => {
															if (!voice_message) {
																toast("voice message is still being processed.");
																return;
															}
															await close?.();
															actEl.focus();

															if (replying) {
																setCurrentReplyingMessage(null);
															}

															sendMessage(
																"",
																{
																	flags: 8192,
																	channel_id: currentChannel().id,
																	sticker_ids: [],
																	type: 0,
																	message_reference: replying
																		? {
																				message_id: replying.id,
																				channel_id: replying.$channel.id,
																		  }
																		: undefined,
																},
																[
																	{
																		filename: "voice-message.ogg",
																		...voice_message,
																	},
																]
															);
														}}
														onCancel={async () => {
															await close?.();
															actEl.focus();
														}}
													/>
												));
												return;
											}
											case "delete-uploads":
												setAttachments([]);
												break;
											case "upload":
												filePicker().then((blob) => {
													const origFileName = blob.name;

													const filename = origFileName.endsWith(".3gp") ? origFileName.slice(0, -3) + "mp4" : origFileName;

													setAttachments((a) => [
														...a,
														{
															filename,
															blob,
														},
													]);
												});
												break;
											case "settings": {
												sleep(500).then(() => {
													const close = fullscreen(() => (
														<Settings
															onClose={async () => {
																await close?.();
																actEl.focus();
															}}
														/>
													));
												});

												return;
											}
											case "interaction":
												batch(() => {
													setCurrentReplyingMessage(null);
													setCurrentEditingMessage(null);
												});
												break;

											case "emoji": {
												await EmojiPicker.preload();
												const close = toolshed(() => (
													<EmojiPicker
														guild={untrack(currentDiscordGuild)}
														onSelect={async (emoji, variation) => {
															await close?.();
															actEl.focus();
															if ("guild" in emoji) {
																typeInTextarea(`<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.$}>`);
																return;
															}
															typeInTextarea(variation || emoji.$, actEl);
														}}
														onClose={async () => {
															await close?.();

															actEl.focus();
														}}
													/>
												));

												return;
											}

											case "gif": {
												const close = toolshed(() => (
													<GifPicker
														onSelect={async (url) => {
															await close?.();
															actEl.focus();
															sendMessage(url);
														}}
														onClose={async () => {
															await close?.();

															actEl.focus();
														}}
													/>
												));
												return;
											}
										}

										actEl.focus();

										console.log("option selected", a);
									}}
								/>
							));

							if (!close) {
								actEl.focus();
							}
						}
					}}
					// ref={messageTextAreaRef}
				></textarea>
				<div class={styles.hidden} ref={hiddenDiv}>
					{value()}
				</div>
				<Show when={!value()}>
					<div class={styles.placeholder}>Message {<PlaceholderName />}</div>
				</Show>
			</div>
			<div
				class={styles.grow}
				style={{
					height: messageBoxFocused() ? "20px" : 0,
				}}
			></div>
			<div class={styles.bar}>
				<div class={value() || attachments().length ? undefined : styles.hide}>
					<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20">
						<path d="M774.913-435.13 193.565-201.826q-24.783 10.392-45.935-4.347-21.153-14.74-21.153-40.523v-466.608q0-25.783 21.153-40.523 21.152-14.739 45.935-4.347L774.913-524.87q30.348 12.391 30.348 44.87t-30.348 44.87ZM216-307.479 649.086-480 216-652.521v92.042L440.479-480 216-399.521v92.042Zm0 0v-345.042V-307.479Z" />
					</svg>
				</div>
				<div>
					<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="20" viewBox="0 -960 960 960" width="20">
						<path d="m312.523-430.999 75.956 75.955q14.956 14.957 14.956 34.544 0 19.587-14.956 34.544-14.957 14.957-34.544 14.957-19.587 0-34.544-14.957L159.601-445.18q-6.906-6.907-10.819-16.033-3.913-9.126-3.913-18.587t3.913-18.587q3.913-9.126 10.609-16.222l160-159.435q14.957-14.957 34.544-14.957 19.587 0 34.544 14.957 14.956 14.957 14.956 34.544 0 19.587-14.956 34.544l-75.956 75.955h424.694V-588q0-20.387 14.246-34.694 14.246-14.307 34.544-14.307 20.298 0 34.755 14.307 14.456 14.307 14.456 34.694v58.999q0 41.005-28.498 69.503-28.498 28.499-69.503 28.499H312.523Z" />
					</svg>
				</div>
				<div></div>
			</div>
		</div>
	);
}

function MessageBox() {
	return (
		<Show when={currentDiscordChannel()}>
			<MessageBoxWithChannel $={currentDiscordChannel() as DiscordTextChannel} />
		</Show>
	);
}

function ReadonlyMessageBox() {
	let noPermRef!: HTMLDivElement;

	onMount(() => {
		setMessageBoxHeight(32);
		setMessageBoxFocused(false);
	});

	return (
		<>
			<div class={styles.noPerm}>
				<MessageBoxHeader />
				<div class={styles.text}>This channel is read only.</div>
			</div>
			<div
				style={{
					position: "fixed",
					bottom: "0",
					width: "100vw",
					height: "1px",
				}}
				tabIndex={-1}
				ref={noPermRef}
				onFocus={(e) => {
					if (e.currentTarget !== e.target) return;
					setLastFocused("message-box");
				}}
				classList={{
					focusable: true,
					[styles.bar]: true,
					noperm: true,
				}}
			></div>
		</>
	);
}

function MessageBoxOrNoPerm(props: { $: DiscordGuildTextChannel }) {
	// side effect
	const _sideEffect = useStore(() => props.$, "permission_overwrites");

	const canSendMessages = () => {
		_sideEffect();
		return props.$.roleAccess().SendMessages !== false;
	};

	createEffect(() => {
		setReadonlyChannel(!canSendMessages());
	});

	return (
		<Show when={canSendMessages()} fallback={<ReadonlyMessageBox />}>
			<MessageBox />
		</Show>
	);
}

function MessageBoxGuild(props: { $: DiscordGuildTextChannel }) {
	return (
		<Show when={"guild" in props.$} fallback={<MessageBox />}>
			<MessageBoxOrNoPerm $={props.$} />
		</Show>
	);
}

function MessageBoxNullCheck() {
	return (
		<Show when={currentDiscordChannel()}>
			<MessageBoxGuild $={currentDiscordChannel() as DiscordGuildTextChannel} />
		</Show>
	);
}

type ValidChannel = Extract<
	NonNullable<ReturnType<typeof currentDiscordChannel>>,
	{
		getMessages: Function;
	}
>;

type DiscordMessageType = NonNullable<ReturnType<typeof currentDiscordChannel>>["messages"]["state"]["value"][number];

function WaitingForReplyToLoad(props: { waiting: WritableStore<DiscordMessage<any> | null> }) {
	const message = useStore(() => props.waiting);

	return (
		<Show when={message()} fallback={<em>Message has not loaded.</em>}>
			<ReplyDescriptionText $={message()!} />
		</Show>
	);
}

function WaitForReplyToLoad(props: { $: DiscordMessageType }) {
	const mJar = () => currentDiscordChannel()?.messages;

	const message_id = () => props.$.reference?.message_id || props.$.$.referenced_message?.id;

	const waiting = () => mJar()?.waitForMessage(message_id()!)!;

	return (
		<Show when={mJar() && message_id()} fallback={<em>Message has not loaded.</em>}>
			<Show when={waiting()} fallback={<em>Message has not loaded.</em>}>
				<WaitingForReplyToLoad waiting={waiting()} />
			</Show>
		</Show>
	);
}

function toHHMMSS(time: number) {
	const sec_num = Math.ceil(time);
	let hours: string | number = Math.floor(sec_num / 3600);
	let minutes: string | number = Math.floor((sec_num - hours * 3600) / 60);
	let seconds: string | number = sec_num - hours * 3600 - minutes * 60;

	return (hours ? ("0" + hours).slice(-2) + ":" : "") + ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);
}

function ReplyDescriptionText(props: {
	/**
	 * The message being replied
	 */
	$: DiscordMessageType;
}) {
	const content = useStore(() => props.$, "content");

	const firstAttachement = () => props.$.attachments.value[0];

	return (
		<>
			<div class={styles.text}>
				<span class={styles.label}>
					<UserLabel color prefix="@" $={props.$.author} nickname guild={currentDiscordGuild()} />
				</span>
				{firstAttachement()?.waveform ? "🎙️ " + toHHMMSS(firstAttachement().duration_secs!) : ""}
				<Markdown text={(content() || "").slice(0, 150)} inline renderer={renderer} />
			</div>
		</>
	);
}

function ReplyDescription(props: { $: DiscordMessageType }) {
	const mJar = () => currentDiscordChannel()?.messages;
	const message_id = () => props.$.reference?.message_id || props.$.$.referenced_message?.id;

	const has = () => mJar()!.get(message_id()!);

	return (
		<Show when={mJar()}>
			<Show
				when={!message_id()}
				fallback={
					<Show when={has()} fallback={<WaitForReplyToLoad $={props.$} />}>
						<ReplyDescriptionText $={has()!} />
					</Show>
				}
			>
				Something went wrong.
			</Show>
		</Show>
	);
}

function MessageSeparatorAvatar(props: { $: DiscordMessageType }) {
	return <UserAvatar $={props.$.author} guild={currentDiscordGuild() || undefined} size={24} />;
}

function MessageSeparator(props: { $: DiscordMessageType }) {
	const referenced_message = () => props.$.$.referenced_message;
	const interaction = () => props.$.$.interaction;

	const user_interaction = () => {
		const _interaction = interaction();

		const client = discordClientReady();

		if (client && _interaction?.user) {
			const user = _interaction.user;
			return client.addUser(user);
		}

		return false;
	};

	return (
		<div class={styles.Separator}>
			<Show when={referenced_message() && props.$.$.type === 19}>
				<div class={styles.reply}>
					<ReplyBadge class={styles.badge} />
					<Show when={referenced_message() !== null} fallback={<em>Original message was deleted</em>}>
						<ReplyDescription $={props.$} />
					</Show>
				</div>
			</Show>
			<Show when={interaction()}>
				<div class={styles.reply}>
					<ReplyBadge class={styles.badge} />
					<div class={styles.text}>
						<span class={styles.label}>
							<Show when={user_interaction()}>{(user_interaction) => <UserLabel color prefix="@" $={user_interaction()} nickname guild={currentDiscordGuild()} />}</Show>
						</span>
						used <a>/{interaction()!.name}</a>
					</div>
				</div>
			</Show>
			<div class={styles.avatar_wrapper}>
				<MessageSeparatorAvatar $={props.$} />
			</div>
			<div class={styles.name}>
				<UserLabel color nickname $={props.$.author} guild={currentDiscordGuild()} />{" "}
				<Show when={props.$.author.$.bot}>
					<span class={styles.bot}>{props.$.$.webhook_id ? "WEBHOOK" : "BOT"}</span>
				</Show>
				<span class={styles.date}>{timeStamp(props.$.$.timestamp)}</span>
			</div>
		</div>
	);
}

const JDECKED = "https://jdecked.github.io/twemoji/v/latest/svg/";

/**
 * Creates img element, waits if error, if error occurs fallback to colr font
 */
function Twemoji(props: { children: string; bigEmoji: boolean }) {
	const size = props.bigEmoji ? 32 : 14;
	const url = JDECKED + toCodePoint(props.children) + ".svg";

	const [useText, setText] = createSignal(false);
	const [didError, setError] = createSignal(false);

	return (
		<span
			class={styles.emoji}
			style={{
				width: size + "px",
				height: size + "px",
				"--emoji_url": `url(${url})`,
			}}
		>
			<Show when={!didError()}>
				<img
					style={{
						display: "inline",
						opacity: 0,
						position: "absolute",
					}}
					onError={() => {
						batch(() => {
							setText(true);
							setError(true);
						});
					}}
					onLoad={() => {
						setText(false);
					}}
					src={url}
				/>
			</Show>
			<Show when={useText()}>{props.children}</Show>
		</span>
	);
}

function UserMention(props: { $: DiscordUser }) {
	const guild = untrack(currentDiscordGuild);

	return <UserLabel prefix="@" nickname $={props.$} guild={guild} />;
}

function UserMentionFromID(props: { id: string }) {
	const [user, setUser] = createSignal<DiscordUser | null>(null);

	createEffect(() => {
		const client = untrack(discordClientReady)!;

		const user = client.users.get(props.id);
		if (user) {
			setUser(user);
			return;
		}

		const cb = (id: string, _user: DiscordUser | undefined | void) => {
			if (id == props.id) {
				setUser(_user || null);
			}
		};

		client.users.on("update", cb);

		onCleanup(() => {
			client.users.off("update", cb);
		});
	});

	return (
		<Show when={user()} fallback={<span class={styles.mention}>loading...</span>}>
			<span class={styles.mention}>
				<UserMention $={user()!} />
			</span>
		</Show>
	);
}

function EveryoneHere(props: { node: any }) {
	return <span class={styles.mention}>@{props.node.type}</span>;
}

const ChannelMentionIcon = () => (
	<span class={styles.channelMentionIcon}>
		<TextIcon />
	</span>
);
const MessageLinkSuffix = () => (
	<>
		<ChevronSmallRightIcon class={styles.chevron} />
		<span class={styles.channelMentionIcon}>{<ChatIcon />}</span>
	</>
);

function ChannelMentionRecipients(props: { $: DiscordGroupDMChannel | DiscordDMChannel; children: JSXElement }) {
	const recipients = useStore(() => props.$.recipients);

	return (
		<span class={styles.mention}>
			<ChannelMentionIcon />
			<For each={recipients()}>
				{(a, i) => {
					return (
						<>
							{i() > 0 && ", "}
							<UserLabel nickname $={a} />
						</>
					);
				}}
			</For>
			{props.children}
		</span>
	);
}

function ChannelMention(props: { $: DiscordGroupDMChannel | DiscordGuildTextChannel | DiscordDMChannel; children?: JSXElement }) {
	const name = useStore(() => props.$ as DiscordGroupDMChannel, "name");

	return (
		<Show
			when={name()}
			fallback={
				<Show when={"recipients" in props.$}>
					<ChannelMentionRecipients $={props.$ as Extract<typeof props.$, { recipients: any }>}>{props.children}</ChannelMentionRecipients>
				</Show>
			}
		>
			<span class={styles.mention}>
				<ChannelMentionIcon />
				{name()}
				{props.children}
			</span>
		</Show>
	);
}

const LoadingMention = () => <span class={styles.mention}>loading...</span>;

function RoleMentionFromIDGuild(props: { id: string; guild: DiscordGuild }) {
	const roles = useStore(() => props.guild, "roles");
	const role = () => roles().find((a) => a.id == props.id);

	const rgb = () => decimal2rgb(role()!.color, true);

	return (
		<Show when={role()} fallback={<LoadingMention />}>
			<span
				style={{
					color: `rgb(${rgb()})`,
					"background-color": `rgba(${rgb()},0.2)`,
				}}
				class={styles.mention}
			>
				@{role()!.name}
			</span>
		</Show>
	);
}

function RoleMentionFromID(props: { id: string }) {
	return (
		<Show when={currentDiscordGuild()} fallback={<LoadingMention />}>
			<RoleMentionFromIDGuild id={props.id} guild={currentDiscordGuild()!} />
		</Show>
	);
}

function SpoilerInline(props: { children: JSXElement }) {
	const [show, setShow] = createSignal(false);

	const color = () => {
		const _show = show();
		const theme = themeStyle();

		return _show ? undefined : theme ? "#c4c9ce" : "#1e1f22";
	};

	const bg = () => {
		const _show = show();
		const theme = themeStyle();

		return _show ? `rgba(${(theme ? "0," : "255,").repeat(3)} 0.1)` : theme ? "#c4c9ce" : "#1e1f22";
	};

	return (
		<div
			style={{
				display: "inline",
				"background-color": bg(),
				color: color(),
				"border-radius": "3px",
			}}
			classList={{ [styles.spoiler_hidden]: !show() }}
		>
			<FocusableLink onNavigate={() => setShow((e) => !e)} react={props.children} />
		</div>
	);
}

const DeletedChannel_ = () => <span class={styles.mention}>#deleted-channel</span>;

const renderer: Renderer = {
	user: (props) => {
		return <UserMentionFromID id={props.node.id} />;
	},
	everyone: EveryoneHere,
	here: EveryoneHere,

	twemoji: (props) => {
		return <Twemoji bigEmoji={Boolean(props.ref.bigEmoji)}>{props.node.name}</Twemoji>;
	},

	subtext: (props) => {
		console.log("subtext", props);
		return (
			<div class={styles.subtext}>
				<Dynamic component={props.child} />
			</div>
		);
	},

	emoji: (props) => {
		return (
			<span
				class={styles.emoji}
				style={{
					"--emoji_url": `url(https://cdn.discordapp.com/emojis/${props.node.id}.${props.node.animated ? "gif" : "png"}?size=${props.bigEmoji ? 32 : 16})`,
				}}
			/>
		);
	},

	// "url", "autolink", "link"
	url: (props) => {
		const url = () => new URL(props.node.target);
		// console.log(url);

		return (
			<Show
				when={!disableDiscordLinkLabels() && url().hostname.endsWith("discord.com") && url().pathname.startsWith("/channels/") && url().pathname.split("/").slice(2)}
				fallback={<Dynamic component={props.noRenderer} />}
			>
				{(e) => {
					const guild_id = () => e()[0];
					const channel_id = () => e()[1];
					const message_id = () => e()[2];

					return (
						<Show when={guild_id() && channel_id()} fallback={<Dynamic component={props.noRenderer} />}>
							{(e) => {
								const guild = () => (guild_id() == "@me" ? null : untrack(discordClientReady)?.guilds.get(guild_id()));

								const channel = () => (guild() ? guild()!.channels.get(channel_id()) : untrack(discordClientReady)?.dms.get(channel_id()));

								console.log(guild_id(), channel_id(), message_id(), channel());

								return (
									<Show when={channel()} fallback={<Dynamic component={props.noRenderer} />}>
										<Show
											when={"roleAccess" in channel()! && (channel() as Extract<ReturnType<typeof channel>, { roleAccess: any }>).roleAccess().ViewChannel === false}
											fallback={
												<FocusableLink
													onNavigate={async () => {
														batch(() => {
															setCurrentDiscordGuild(guild() || null);
															setCurrentDiscordChannel(channel() as any);
														});
														await sleep(0);
														focusMessages();
													}}
													react={
														<ChannelMention $={channel() as any}>
															<Show when={message_id() || guild_id() == "@me"}>
																<MessageLinkSuffix />
															</Show>{" "}
														</ChannelMention>
													}
												/>
											}
										>
											<span class={styles.mention}>
												<span class={styles.channelMentionIcon}>
													<LockIcon />
												</span>
												No Access
											</span>
										</Show>
									</Show>
								);
							}}
						</Show>
					);
				}}
			</Show>
		);
	},

	role: (props) => {
		return <RoleMentionFromID id={props.node.id} />;
	},

	channel: (props) => {
		const ready = untrack(discordClientReady),
			guild = untrack(currentDiscordGuild);
		const dms = ready?.dms!;

		const channel = () =>
			guild?.channels.get(props.node.id) ||
			(!disableDiscordLinkLabels() &&
				// only search even further when discord link labels is enabled
				(ready?.guilds.findChannelById(props.node.id) || dms?.get(props.node.id)));

		const guildFromChannel = () => {
			const _channel = channel();
			return (_channel && "guild" in _channel && _channel.guild) || undefined;
		};

		return (
			<Show when={ready && channel()} fallback={<DeletedChannel_ />}>
				<Show when={channel()} fallback={<DeletedChannel_ />}>
					{(channel) => (
						<Show
							when={"roleAccess" in channel() && (channel() as Extract<ReturnType<typeof channel>, { roleAccess: Function }>).roleAccess().ViewChannel === false}
							fallback={
								<Show
									when={guildFromChannel()}
									fallback={
										// TODO: Message Links as mentions
										<ChannelMention $={channel() as any} />
									}
								>
									<FocusableLink
										onNavigate={async () => {
											batch(() => {
												setCurrentDiscordGuild(guildFromChannel()!);
												setCurrentDiscordChannel(channel() as any);
											});
											await sleep(0);
											focusMessages();
										}}
										react={<ChannelMention $={channel() as any} />}
									/>
								</Show>
							}
						>
							<span class={styles.mention}>
								<span class={styles.channelMentionIcon}>
									<LockIcon />
								</span>
								No Access
							</span>
						</Show>
					)}
				</Show>
			</Show>
		);
	},

	codeBlock: (props) => {
		return (
			<pre>
				<code>{props.node.content}</code>
			</pre>
		);
	},

	spoiler: (props) => {
		return (
			<SpoilerInline>
				<Dynamic component={props.child} />
			</SpoilerInline>
		);
	},
};

function MessageContent(props: MarkdownProps) {
	return <Markdown {...props} renderer={renderer} />;
}

let chatbox: HTMLElement | undefined;

function Message(props: {
	$: DiscordMessageType;
	index: number;
	last: boolean;
	channel: ValidChannel;
	/**
	 * the message before this message
	 */
	before?: DiscordMessageType;
}) {
	const _content = useStore(() => props.$, "content");

	const content = () => {
		const _ = _content();

		return props.$.forwarded ? props.$.forwarded_content : _;
	};

	const edited = useStore(() => props.$, "edited_timestamp");
	const deleted = useStore(() => props.$.deleted);
	const embeds = useStore(() => props.$.embeds);
	const reactions = useStore(() => props.$.reactions.state);
	const attachments = useStore(() => props.$.attachments);
	const stickers = useStore(() => props.$.stickers);

	let divRef!: HTMLDivElement;

	const [bigEmoji, setBigEmoji] = createSignal(false);

	onCleanup(() => {
		// this may not work, need to figure out when onCleanup is called
		SpatialNavigation.move("down") || SpatialNavigation.move("up");
	});

	// side effect
	// rerenderMessages.value;

	// TODO: Copy sveltecord navigation

	const [focused, setFocused] = createSignal(false);
	const [innerFocus, setInnerFocus] = createSignal(false);

	// TODO: INNER FOCUS
	useKeypress("5", async () => {
		if (untrack(focused) && untrack(currentView) == Views.MESSAGES) {
			// let's return early
			if (!divRef.querySelector(".v-image, .focusable-attachment")) return;

			divRef.blur();
			setInnerFocus(true);
			await sleep(0);
			makeContentFocusable(async () => {
				setInnerFocus(false);
				await sleep(0);
				divRef.focus({ preventScroll: true });
			}, props.$.id);
		}
	});

	onMount(async () => {
		if (!props.last) return;
		console.log("last message mounted!!!");

		// let's wait for the message to be properly rendered
		await sleep(2);

		const actEl = document.activeElement as HTMLElement;
		if (actEl.classList.contains("noperm")) {
			console.log("NO PERM CHANNEL FOCUSING LAST MESSAGE");
			divRef.focus({ preventScroll: true });
		}

		if (shouldScrollToBottom(divRef.offsetHeight)) {
			scrollToBottom();
			console.log("SCROLLED TO BOTTOM");
			const channel = props.channel;
			const readState = props.$.$channel.readState.value;
			const readStateLastMessageID = readState.last_message_id;
			const unread = readState.mention_count > 0 || (readStateLastMessageID !== undefined && props.$.$channel.lastMessageID.value !== readStateLastMessageID);

			if (unread) channel.ack();
		}
	});

	const timestampBefore = () => props.before?.$.timestamp;
	const timestamp = () => props.$.$.timestamp;

	const [hideContent, setHide] = createSignal(false);
	const [markdownRef, setMarkdownRef] = createSignal<MarkdownRef | null>(null);

	createEffect(() => {
		const _content = content();
		if (!_content) return;

		const markdown = markdownRef();
		const ast = markdown?.ast;

		const _embeds = embeds();

		// if ast is not present, we can't decide for anything
		if (!ast) return;

		if (_embeds && _embeds.length == 1 && (_embeds[0].type == "image" || _embeds[0].type == "gifv") && ast.length == 1 && ["link", "url"].includes(ast[0].type)) {
			setHide(true);
		}
	});

	const guild = () => currentDiscordGuild();

	return (
		<>
			{timestampBefore() && decideDateSeparator(timestamp(), timestampBefore()!) && (
				<DateSeparator>
					{new Date(timestamp()).toLocaleDateString([], {
						month: "long",
						day: "numeric",
						year: "numeric",
					})}
				</DateSeparator>
			)}
			<div
				ref={divRef}
				tabIndex={-1}
				classList={{
					[styles.Message]: true,
					"msg-focused": innerFocus(),
					focusable: true,
					last: props.last,
					[styles.mentioned]: props.$.wouldPing(false),
					[styles.deleted]: deleted(),
					["msg-" + props.$.id]: true,
					[styles.forwarded]: props.$.forwarded,
				}}
				onKeyDown={async (e) => {
					if (e.currentTarget !== e.target) return;
					if (!untrack(focused)) return;
					if (untrack(isKeypressPaused)) return;

					if (["1", "2", "3", "0", "*", "#"].includes(e.key) && !untrack(deleted)) {
						const key = e.key;
						const message = props.$;
						switch (key) {
							case "0":
								jumpToBottom();
								break;
							case "2":
								if (message.canPin()) {
									message.pin(!message.value.pinned);
								}
								break;
							case "3":
								if (message.canDelete()) {
									message.delete();
								}
								break;
							case "*":
								editMessage(message);
								break;
							case "#":
								replyToMessage(message);
								break;
						}
						return;
					}

					if (e.key == "Backspace") {
						setCurrentView(Views.CHANNELS);
						await sleep(0);
						SpatialNavigation.focus("channels");
					}

					if (e.key == "SoftRight" && !untrack(deleted)) {
						const items = [
							props.$.reactions.canAddReaction()
								? {
										id: "react",
										text: "Add Reaction",
										icon: () => <EmojiIcon />,
								  }
								: null,
							props.$.reactions.state.value.length > 0
								? {
										id: "reactions",
										text: "View Reactions",
										icon: () => <EmojiIcon />,
								  }
								: null,
							props.$.isEditable()
								? {
										id: "edit",
										text: "Edit Message",
										icon: () => <PencilIcon />,
								  }
								: null,
							props.$.isRepliable()
								? {
										id: "reply",
										text: "Reply",
										icon: () => (
											<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
												<path
													fill="currentColor"
													d="M2.3 7.3a1 1 0 0 0 0 1.4l5 5a1 1 0 0 0 1.4-1.4L5.42 9H11a7 7 0 0 1 7 7v4a1 1 0 1 0 2 0v-4a9 9 0 0 0-9-9H5.41l3.3-3.3a1 1 0 0 0-1.42-1.4l-5 5Z"
													class=""
												></path>
											</svg>
										),
								  }
								: null,

							{
								id: "forward",
								text: "Forward",
								icon: () => (
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
										<path
											fill="currentColor"
											d="M21.7 7.3a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4-1.4L18.58 9H13a7 7 0 0 0-7 7v4a1 1 0 1 1-2 0v-4a9 9 0 0 1 9-9h5.59l-3.3-3.3a1 1 0 0 1 1.42-1.4l5 5Z"
											class=""
										></path>
									</svg>
								),
							},

							props.$.canDelete()
								? {
										id: "delete",
										text: "Delete Message",
										icon: () => (
											<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
												<path
													fill="currentColor"
													d="M14.25 1c.41 0 .75.34.75.75V3h5.25c.41 0 .75.34.75.75v.5c0 .41-.34.75-.75.75H3.75A.75.75 0 0 1 3 4.25v-.5c0-.41.34-.75.75-.75H9V1.75c0-.41.34-.75.75-.75h4.5Z"
													class=""
												></path>
												<path
													fill="currentColor"
													fill-rule="evenodd"
													d="M5.06 7a1 1 0 0 0-1 1.06l.76 12.13a3 3 0 0 0 3 2.81h8.36a3 3 0 0 0 3-2.81l.75-12.13a1 1 0 0 0-1-1.06H5.07ZM11 12a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0v-6Zm3-1a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"
													clip-rule="evenodd"
													class=""
												></path>
											</svg>
										),
								  }
								: null,
							props.$.canPin()
								? {
										id: "pin",
										text: props.$.value.pinned ? "Unpin Message" : "Pin Message",
										icon: () => <PinIcon />,
								  }
								: null,

							!untrack(readonlyChannel) && props.$.author.id != props.$.$channel.$client.config.user_id
								? {
										id: "mention",
										text: "Mention User",
										icon: () => (
											<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
												<path
													fill="currentColor"
													d="M16.44 6.96c.29 0 .51.25.47.54l-.82 6.34c-.02.08-.03.2-.03.34 0 .71.28 1.07.85 1.07.49 0 .94-.21 1.36-.63.43-.42.77-1 1.02-1.72.26-.75.38-1.57.38-2.48 0-1.35-.29-2.54-.87-3.56a5.92 5.92 0 0 0-2.45-2.35 7.68 7.68 0 0 0-3.61-.83c-1.55 0-2.96.37-4.22 1.1a7.66 7.66 0 0 0-2.96 3.07 9.53 9.53 0 0 0-1.09 4.66c0 1.45.26 2.77.78 3.95a6.3 6.3 0 0 0 2.47 2.81 8.3 8.3 0 0 0 4.36 1.05 12.43 12.43 0 0 0 5.35-1.18.5.5 0 0 1 .7.24l.46 1.07c.1.22.02.47-.19.59-.77.43-1.69.77-2.75 1.02-1.23.3-2.48.44-3.76.44-2.18 0-4-.44-5.48-1.33a8.1 8.1 0 0 1-3.27-3.57 11.93 11.93 0 0 1-1.07-5.12c0-2.24.47-4.19 1.4-5.84a9.7 9.7 0 0 1 3.86-3.8c1.62-.9 3.4-1.34 5.36-1.34 1.8 0 3.4.37 4.8 1.12 1.4.72 2.5 1.76 3.28 3.1a8.86 8.86 0 0 1 1.16 4.56c0 1.36-.23 2.57-.7 3.64a5.81 5.81 0 0 1-1.92 2.47c-.82.58-1.76.87-2.81.87a2.4 2.4 0 0 1-1.6-.5c-.4-.35-.65-.78-.73-1.32-.3.55-.74 1-1.36 1.34a4.3 4.3 0 0 1-2.03.48A3.4 3.4 0 0 1 8 16C7.33 15.16 7 14 7 12.5c0-1.14.2-2.16.6-3.05.43-.89 1-1.57 1.73-2.06a4.3 4.3 0 0 1 4.27-.31c.47.29.82.68 1.07 1.16l.3-.95c.06-.2.25-.33.46-.33h1.02Zm-5.06 8.24c.8 0 1.45-.35 1.97-1.04.51-.7.77-1.6.77-2.7 0-.88-.18-1.56-.53-2.03a1.76 1.76 0 0 0-1.5-.73c-.8 0-1.45.35-1.97 1.04a4.28 4.28 0 0 0-.78 2.67c0 .9.17 1.58.51 2.06.36.49.87.73 1.53.73Z"
													class=""
												></path>
											</svg>
										),
								  }
								: null,
						];

						if (items.filter((a) => a).length == 0) {
							return;
						}

						const actEl = e.currentTarget;
						actEl.blur();

						const close = toolshed(() => (
							<OptionsMenu
								onSelect={async (res) => {
									await close?.();
									actEl.focus();
									switch (res) {
										case "react": {
											await EmojiPicker.preload();
											const close = toolshed(() => (
												<div style="height: 80vh;">
													<EmojiPicker
														guild={untrack(currentDiscordGuild)}
														onSelect={async (emoji, withVariation) => {
															await close?.();
															actEl.focus();

															if ("guild" in emoji) {
																props.$.reactions.addReaction({
																	id: emoji.$,
																	name: emoji.name,
																});
															} else {
																props.$.reactions.addReaction({
																	id: null,
																	name: withVariation || emoji.$,
																});
															}
														}}
														onClose={async () => {
															await close?.();
															actEl.focus();
														}}
													/>
												</div>
											));
											break;
										}

										case "reactions": {
											const close = popup(() => (
												<MessageReactionsPopup
													guild={untrack(currentDiscordGuild)}
													$={props.$}
													onClose={async () => {
														await close?.();
														actEl.focus();
													}}
												/>
											));
											break;
										}

										case "delete":
											props.$.delete();
											break;

										case "edit":
											editMessage(props.$);
											break;

										case "reply":
											replyToMessage(props.$);
											break;
										case "forward":
											setCurrentForwardMessage({
												message_id: props.$.id,
												channel_id: props.channel.id,
												guild_id: "guild" in props.channel ? props.channel.guild.id : null,
											});
											break;

										case "pin":
											props.$.value.pinned ? props.$.unpin() : props.$.pin();
											break;

										case "mention":
											mentionUserFromMessage(props.$);

											break;
									}
								}}
								items={items}
							/>
						));
					}
				}}
				onFocus={(e) => {
					if (e.currentTarget !== e.target) return;
					// centerScroll(divRef);
					setFocused(true);
					setLastFocused("chat");

					if (props.last) {
						const channel = props.channel;
						const readState = props.$.$channel.readState.value;
						const readStateLastMessageID = readState.last_message_id;
						const unread = readState.mention_count > 0 || (readStateLastMessageID !== undefined && props.$.$channel.lastMessageID.value !== readStateLastMessageID);

						if (unread) channel.ack();
					}
				}}
				onBlur={() => {
					setFocused(false);
				}}
				on:sn-focused={(e) => {
					if (e.currentTarget !== e.target) return;
					const actEl = document.activeElement as HTMLElement;
					if (props.last && chatbox && actEl.offsetHeight < chatbox.offsetHeight) {
						centerScroll(actEl);
					}
				}}
				on:sn-willunfocus={function (e) {
					if (e.currentTarget !== e.target) return;
					// console.log("WILLUNFOCUS");
					const direction = e.detail.direction;
					const next = e.detail.nextElement as HTMLElement;

					if (!/up|down/.test(direction)) return;

					const actEl = document.activeElement as HTMLElement;
					if (!actEl.classList.contains(styles.Message)) return;
					if (!chatbox) return;

					if (next.classList.contains("noperm")) {
						// console.warn("NEXT ELEMENT IS NOPERM LET'S PREVENT FOCUS");
						e.preventDefault();
					}

					const center = (el: HTMLElement) => centerScroll(el, untrack($longpress));

					if (actEl.offsetHeight > chatbox.offsetHeight) {
						// console.warn("current message is bigger than screen, we scroll...");

						if (props.last && direction === "down") {
							// console.warn("last message, we scroll until bottom is reached");
							chatbox.scrollBy({
								top: 66,
								behavior: untrack($longpress) ? "auto" : "smooth",
							});

							if (chatbox.scrollTop === chatbox.scrollHeight - chatbox.offsetHeight) {
								// console.warn("successfull scrolled to bottom");
								return;
							}
							e.preventDefault();
							return;
						}

						e.preventDefault();
						if (!isInViewport(next))
							chatbox.scrollBy({
								top: direction === "up" ? -66 : 66,
								behavior: untrack($longpress) ? "auto" : "smooth",
							});

						if (!next) {
							console.warn("next element to focus not found!");
							return;
						}

						if (next.offsetHeight + 10 >= chatbox.offsetHeight) {
							console.warn("next element is bigger than viewport hmmmm");
							if (isPartiallyInViewport(next)) {
								next.focus({ preventScroll: true });
								next.scrollIntoView({ behavior: untrack($longpress) ? "auto" : "smooth" });
							}
						} else if (isInViewport(next)) {
							console.warn("next element is not bigger than viewport and is in viewport right now");
							center(next).then(() => {
								next.focus();
							});
						}
					} else if (next.offsetHeight >= chatbox.offsetHeight) {
						console.warn("next element is bigger than viewport but was not before big");
						next.focus({ preventScroll: true });
						next.scrollIntoView({ behavior: untrack($longpress) ? "auto" : "smooth" });
					} else if (next && next.offsetHeight <= chatbox.offsetHeight) {
						// console.warn("i have no idea how this work");

						if (!next.classList.contains("noperm")) {
							center(next);
						}
					}
				}}
				on:sn-navigatefailed={async (e) => {
					if (e.currentTarget !== e.target) return;
					console.log("NAVIGATE FAILED");
					const direction = e.detail.direction;
					if (!chatbox) return;

					if (direction == "down" && props.last) {
						if (!(chatbox.scrollTop === chatbox.scrollHeight - chatbox.offsetHeight)) {
							chatbox.scrollBy({
								top: 66,
								behavior: untrack($longpress) ? "auto" : "smooth",
							});
						}
					}

					if (direction == "left") {
						setCurrentView(Views.CHANNELS);
						await sleep(0);
						SpatialNavigation.focus("channels");
					}
				}}
			>
				<Switch
					fallback={
						<>
							<Show when={decideMessageSeparator(props.$, props.before, props.channel)}>
								<MessageSeparator $={props.$} />
							</Show>
							<div class={styles.message_content}>
								<Show when={props.$.forwarded}>
									<div class={styles.forwarded_header}>
										<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24">
											<path
												fill="currentColor"
												d="M21.7 7.3a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4-1.4L18.58 9H13a7 7 0 0 0-7 7v4a1 1 0 1 1-2 0v-4a9 9 0 0 1 9-9h5.59l-3.3-3.3a1 1 0 0 1 1.42-1.4l5 5Z"
												class=""
											></path>
										</svg>
										Forwarded
									</div>
								</Show>
								<Show when={content()}>
									<div
										classList={{
											[styles.text]: true,
											// [styles.content]: true,
											[styles.bigEmoji]: bigEmoji(),
											[styles.hideContent]: hideContent(),
										}}
									>
										<MessageContent setMarkdownRef={setMarkdownRef} setBigEmoji={setBigEmoji} text={content()} />
										<Show when={edited()}>
											<span class={styles.edited}>(edited)</span>
										</Show>
									</div>
								</Show>
								<Show when={embeds().length || attachments().length || stickers()?.length}>
									<MessageEmbeds renderer={renderer} $={props.$ as DiscordMessage} />
								</Show>
							</div>
							<Show when={reactions().length}>
								<MessageReactions $={reactions()} />
							</Show>
						</>
					}
				>
					<Match when={props.$.$.type == 7 && guild()}>
						<JoinMessage $={props.$ as DiscordMessage} guild={guild()!} />
					</Match>
					<Match when={props.$.$.type == 6}>
						<PinnedMessage $={props.$ as DiscordMessage} guild={guild()} />
					</Match>
					<Match when={props.$.$.type == 2}>
						<LeaveDMMessage $={props.$} />
					</Match>
					<Match when={props.$.$.type == 3}>
						<CallMessage $={props.$}></CallMessage>
					</Match>
					<Match when={props.$.$.type == 1}>
						<JoinDMMessage $={props.$} />
					</Match>
					<Match when={props.$.$.type == 4}>
						<NameChangeDMMessage $={props.$} />
					</Match>
				</Switch>
			</div>
		</>
	);
}

let lastScrollHeight = 0;

const tick = () => Promise.resolve();

const debouncedLazy = debounce((guild: DiscordGuild, user_ids?: string[]) => {
	guild.lazy(user_ids);
}, 2000);

function getMentionedUserIDs(messages: APIMessage[], requestedAlready: Set<string>) {
	const usersMentioned = new Set<string>();

	messages.forEach((a) => {
		a.mentions.forEach((a) => {
			if (!requestedAlready.has(a.id)) {
				usersMentioned.add(a.id);
			}
		});

		const userIDfromInteraction = a.interaction?.user.id;

		if (userIDfromInteraction) {
			const id = userIDfromInteraction;
			if (!requestedAlready.has(id)) {
				usersMentioned.add(id);
			}
		}

		usersMentioned.add(a.author.id);
	});

	return difference(Array.from(usersMentioned), Array.from(requestedAlready));
}

async function loadMoreMessages(channel: ValidChannel) {
	// move to the focusable message
	SpatialNavigation.move("down");
	setIsLoadingMoreMessages(true);
	await tick();

	const messages = channel.messages.state.value;
	const first = messages[0];

	if (!first || !chatbox) {
		setIsLoadingMoreMessages(false);
		return;
	}

	lastScrollHeight = chatbox.scrollHeight;

	channel.messages.loadMessages(20).then(async (messages) => {
		setIsLoadingMoreMessages(false);
		await tick();

		const actEl = document.activeElement as HTMLElement;

		const guild = untrack(currentDiscordGuild);
		if (guild) {
			const requestedAlready = getRequestedUsers(guild.id);
			const users = getMentionedUserIDs(messages, requestedAlready);

			if (users.length) {
				users.forEach((a) => requestedAlready.add(a));
				debouncedLazy(guild, users);
			}
		}

		if (chatbox && actEl && actEl.classList.contains("msg-" + first.id)) {
			await tick();
			const scrollDiff = chatbox.scrollHeight - lastScrollHeight;
			chatbox.scrollTop += scrollDiff;
			if (!isPartiallyInViewport(document.activeElement as HTMLElement)) {
				actEl.blur();
				await tick();
				actEl.focus({ preventScroll: true });
			}
		} else {
			actEl.blur();
			await tick();
			actEl.focus({ preventScroll: true });
		}
	});
}

function LoadMoreMessagesButton(props: { $: ValidChannel }) {
	const [focused, setFocused] = createSignal(false);

	return (
		<Show
			when={!isLoadingMoreMessages()}
			fallback={
				<div
					classList={{
						[styles.button_wrap]: true,
					}}
				>
					<Button disabled={true}>Loading...</Button>
				</div>
			}
		>
			<div
				tabIndex={-1}
				on:sn-navigatefailed={(e) => {
					if (e.detail.direction == "up") loadMoreMessages(props.$);
				}}
				on:sn-enter-down={() => loadMoreMessages(props.$)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				classList={{ focusable: true, [styles.button_wrap]: true }}
			>
				<Button focused={focused()}>Load More</Button>
			</div>
		</Show>
	);
}

function MessagesWrap(props: { channel: ValidChannel }) {
	const messages = useStore<DiscordMessageType[]>(() => props.channel.messages.state as any);

	return (
		<>
			<LoadMoreMessagesButton $={props.channel} />
			<For each={messages()}>{(message, index) => <Message channel={props.channel} before={messages()[index() - 1]} last={index() == messages().length - 1} index={index()} $={message} />}</For>
		</>
	);
}

const alreadyRequestedUsers = new Map<string, Set<string>>();

function getRequestedUsers(id: string) {
	const has = alreadyRequestedUsers.get(id);
	if (has) return has;

	const set = new Set<string>();
	alreadyRequestedUsers.set(id, set);
	return set;
}

function MessageList(props: { channel: ValidChannel }) {
	let chatListScrollableRef!: HTMLDivElement;

	onMount(() => {
		shouldScrollToBottom = (addHeight?: number) => {
			if (untrack(messageBoxFocused)) return true;
			if (addHeight != undefined) {
				return chatListScrollableRef.scrollHeight === chatListScrollableRef.scrollTop + chatListScrollableRef.offsetHeight + addHeight;
			}
			return false;
		};

		chatbox = chatListScrollableRef;
	});

	createEffect(() => {
		DiscordMessage.preserveDeleted = preserveDeleted();
	});

	createEffect(() => {
		const channel = props.channel;

		if (!channel) return;

		console.log("CHANNELS CHANGED");

		setLastFocused("message-box");
		scrollToBottom = (smooth?: boolean) => {
			if (smooth) {
				chatListScrollableRef.scroll({
					top: chatListScrollableRef.scrollHeight,
					behavior: "smooth",
				});
				return;
			}
			chatListScrollableRef.scrollTop = chatListScrollableRef.scrollHeight;
		};

		const hasLoaded = channel.messages.state.value.length > 0;

		if (channel.messages.state.value.length < 20) {
			if (!hasLoaded) {
				setIsLoadingMoreMessages(true);
				// isLoadingMoreMessages.value = true;
			}

			channel.messages.loadMessages(20).then(async (messages) => {
				setIsLoadingMoreMessages(false);
				// isLoadingMoreMessages.value = false;
				await tick();
				const guild = untrack(currentDiscordGuild);
				if (guild) {
					const requestedAlready = getRequestedUsers(guild.id);

					const users = getMentionedUserIDs(messages, requestedAlready);

					if (users.length) {
						users.forEach((a) => requestedAlready.add(a));
						debouncedLazy(guild, users);
					}
				}

				scrollToBottom();
			});
		}

		tick().then(() => scrollToBottom());
	});

	return (
		<div ref={chatListScrollableRef} class={styles.listWrap}>
			<MessagesWrap {...props} />
		</div>
	);
}

function MessageListNullCheck() {
	return (
		<Show when={currentDiscordChannel() && "getMessages" in currentDiscordChannel()!}>
			<MessageList channel={currentDiscordChannel()!} />
		</Show>
	);
}

export function focusMessages() {
	const result = SpatialNavigation.focus(untrack(lastFocused));

	console.log("focusMessages called", result, untrack(lastFocused));

	return result;
}

export default function Messages() {
	onMount(() => {
		SpatialNavigation.add("chat", {
			// temp
			selector: `.${styles.Messages} .${styles.listWrap} .focusable`,

			restrict: "self-first",
			rememberSource: true,
			enterTo: "last-focused",

			straightOnly: true,
			leaveFor: {
				left: "",
				right: "",
			},

			defaultElement: `.${styles.Messages} .focusable:last-child`,
		});

		SpatialNavigation.add("message-box", {
			selector: `.${styles.MessageBox} textarea, .noperm`,
			straightOnly: true,
			leaveFor: {
				up: "@chat",
				left: "",
				right: "",
				down: "",
			},
		});
	});

	onCleanup(() => {
		SpatialNavigation.remove("chat");
		SpatialNavigation.remove("message-box");
	});

	return (
		<div
			classList={{
				[mainViewStyles.messages]: true,
				[mainViewStyles.messagesInFocus]: currentView() == Views.MESSAGES,
				[mainViewStyles.channelsInFocus]: currentView() == Views.CHANNELS,
				[mainViewStyles.guildsInFocus]: currentView() == Views.GUILDS,
			}}
		>
			<div class={styles.Messages}>
				<MessageListNullCheck />
				<MessageBoxNullCheck />
			</div>
		</div>
	);
}
