import {
	Views,
	channelHistory,
	currentDiscordChannel,
	currentDiscordGuild,
	currentView,
	discordClientReady,
	setCurrentDiscordChannel,
	setCurrentView,
	useStoredSignal,
} from "@/signals";
import * as mainViewStyles from "../MainView.module.scss";
import {
	DiscordDMChannel,
	DiscordGroupDMChannel,
	DiscordGuildChannelCategory,
	DiscordGuildTextChannel,
	DiscordPresence,
	DiscordUser,
	convertSnowflakeToDate,
} from "discord";
import { centerScroll, sleep, useKeypress, useStore } from "@/lib/utils";
import DEFAULT_GROUP_DM_AVATARS from "@/assets/group_dm_avatars";
import * as styles from "./Channels.module.scss";
import {
	ComponentProps,
	For,
	JSXElement,
	Show,
	Switch,
	children,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
	untrack,
} from "solid-js";
import UserAvatar from "./components/UserAvatar";
import { GatewayPresenceClientStatus } from "discord/src/lib/types";

import dnd from "../assets/status/dnd.png";
import idle from "../assets/status/idle.png";
import online from "../assets/status/online.png";
import offline from "../assets/status/offline.png";

import desktop_dnd from "../assets/status/desktop_dnd.png";
import desktop_idle from "../assets/status/desktop_idle.png";
import desktop_online from "../assets/status/desktop_online.png";

import mobile_dnd from "../assets/status/mobile_dnd.png";
import mobile_idle from "../assets/status/mobile_idle.png";
import mobile_online from "../assets/status/mobile_online.png";

import web_dnd from "../assets/status/web_dnd.png";
import web_idle from "../assets/status/web_idle.png";
import web_online from "../assets/status/web_online.png";
import CustomErrorBoundary from "./components/CustomErrorBoundary";
import MarqueeOrNot from "./components/MarqueeOrNot";
import UserLabel from "./components/UserLabel";
import SpatialNavigation from "@/lib/spatial_navigation";

const StatusIcons = {
	dnd,
	idle,
	online,
	offline,
	desktop_dnd,
	desktop_idle,
	desktop_online,
	mobile_dnd,
	mobile_idle,
	mobile_online,
	web_dnd,
	web_idle,
	web_online,
} as const;

import TextIcon from "../icons/TextIcon.svg";
import AnnouncementIcon from "../icons/AnnouncementsIcon.svg";
import RulesIcon from "../icons/BookCheckIcon.svg";
import { Dynamic } from "solid-js/web";
import { focusMessages } from "./Messages";
import { preloadSearch } from "@/workers";

const ChannelIcons = {
	text: TextIcon,
	announce: AnnouncementIcon,
	limited: () => (
		<svg
			class="icon_eff5d4"
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				fill-rule="evenodd"
				d="M16 4h.5v-.5a2.5 2.5 0 0 1 5 0V4h.5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm4-.5V4h-2v-.5a1 1 0 1 1 2 0Z"
				clip-rule="evenodd"
				class=""
			></path>
			<path
				fill="currentColor"
				d="M12.5 8c.28 0 .5.22.5.5V9c0 .1 0 .2.02.31.03.34-.21.69-.56.69H9.85l-.67 4h4.97l.28-1.68c.06-.34.44-.52.77-.43a3 3 0 0 0 .8.11c.27 0 .47.24.43.5l-.25 1.5H20a1 1 0 1 1 0 2h-4.15l-.86 5.16a1 1 0 0 1-1.98-.32l.8-4.84H8.86l-.86 5.16A1 1 0 0 1 6 20.84L6.82 16H3a1 1 0 1 1 0-2h4.15l.67-4H4a1 1 0 1 1 0-2h4.15l.86-5.16a1 1 0 1 1 1.98.32L10.19 8h2.31Z"
				class=""
			></path>
		</svg>
	),
	rules: RulesIcon,
};

function channelItemOnFocus(e: FocusEvent) {
	let sync = false;

	// TODO
	// if (shouldChannelScrollBeSync.current) {
	// 	shouldChannelScrollBeSync.current = false;
	// 	sync = true;
	// }

	centerScroll(e.target as HTMLElement, sync);
}

function PresenceSubtitleAvailable(props: { focused: boolean; presence: DiscordUser["presence"]["value"] }) {
	// idk how this is actually implimented
	// i'll assume it shows the one with the smallest number
	const activity = () => props.presence.activities.reduce((acc, loc) => (acc.type < loc.type ? acc : loc));

	return (
		<div class={styles.subtitle}>
			<Show
				when={activity().type === 4}
				fallback={
					<MarqueeOrNot marquee={props.focused}>
						{["Playing", "Streaming", "Listening to", "Watching", "", "Competing in"][activity().type]}{" "}
						<span style={{ "font-weight": 600 }}>{activity().name}</span>
					</MarqueeOrNot>
				}
			>
				<MarqueeOrNot marquee={props.focused}>
					{activity().emoji ? activity().emoji!.name + " " : ""}
					{activity().state}
				</MarqueeOrNot>
			</Show>
		</div>
	);
}

function PresenceSubtitle(props: { focused: boolean; $: DiscordUser }) {
	const presence = useStore(() => props.$.presence);

	return (
		<Show when={props.$ && !(presence().status === "offline" || presence().activities.length === 0)}>
			<PresenceSubtitleAvailable focused={props.focused} presence={presence()} />
		</Show>
	);
}

async function channelItemKeydown(e: KeyboardEvent) {
	if (untrack(currentView) === Views.CHANNELS) {
		if (e.key === "ArrowRight" && untrack(currentDiscordChannel)) {
			setCurrentView(Views.MESSAGES);
			await sleep(0);
			focusMessages();
		}

		if (e.key == "Backspace" || e.key == "ArrowLeft") {
			setCurrentView(Views.GUILDS);
			await sleep(0);
			SpatialNavigation.focus("guilds");
		}
	}
}

function DMItem(props: { $: DiscordDMChannel }) {
	const [focused, setFocused] = createSignal(false);
	const selected = () => currentDiscordChannel() === props.$;
	const unread = useStore(() => props.$.readState, "mention_count");

	const client = props.$.$client;
	const currentUserID = client.ready.user.id;

	const dmUser = props.$.recipients.value.filter((a) => a.id != currentUserID)[0];

	return (
		<div
			onFocus={(e) => {
				setFocused(true);
				channelItemOnFocus(e);
			}}
			onKeyDown={(e) => {
				channelItemKeydown(e);
			}}
			onBlur={(e) => {
				setFocused(false);
			}}
			on:sn-enter-down={async (e) => {
				e.currentTarget.blur();
				console.log("ENTER DOWN WAS PRESSED FOR DM ITEM");

				setCurrentDiscordChannel(props.$);
				if (unread() > 0) props.$.ack();
				setCurrentView(Views.MESSAGES);
				await sleep(0);
				focusMessages();
			}}
			tabIndex={-1}
			classList={{
				focusable: true,
				[styles.dmItem]: true,
				// [styles.focused]: focused(),
				[styles.selected]: selected(),
				[styles.unread]: unread() > 0,
				["channel-" + props.$.id]: true,
			}}
		>
			<RecipientAvatar $={props.$} dmItem />
			<div class={styles.aside}>
				<div class={styles.overflow}>
					<MarqueeOrNot marquee={focused()}>
						<UserLabel nickname $={dmUser} />
					</MarqueeOrNot>
				</div>
				<PresenceSubtitle focused={focused()} $={dmUser} />
			</div>
		</div>
	);
}

function DMGroupMembersNumber(props: { $: DiscordGroupDMChannel }) {
	const recipients = useStore(() => props.$.recipients);
	return <div class={styles.subtitle}>{recipients().length} Members</div>;
}

function DMGroupDefaultName(props: { $: DiscordGroupDMChannel }) {
	const recipients = useStore(() => props.$.recipients);

	const client = props.$.$client;
	const currentUser = client.users.get(client.ready.user.id)!;

	return (
		<For each={recipients().length > 1 ? recipients().filter((a) => a != currentUser) : recipients()}>
			{(a, i) => (
				<>
					{i() > 0 && ", "}
					<UserLabel nickname $={a} />
				</>
			)}
		</For>
	);
}

function DMGroupItem(props: { $: DiscordGroupDMChannel }) {
	const name = useStore(() => props.$, "name");

	const [focused, setFocused] = createSignal(false);

	const selected = () => currentDiscordChannel() === props.$;
	const unread = useStore(() => props.$.readState, "mention_count");

	return (
		<div
			onFocus={(e) => {
				channelItemOnFocus(e);
				setFocused(true);
			}}
			onKeyDown={channelItemKeydown}
			onBlur={() => setFocused(false)}
			on:sn-enter-down={async (e) => {
				e.currentTarget.blur();
				setCurrentDiscordChannel(props.$);
				if (unread() > 0) props.$.ack();
				// await sleep(10);
				setCurrentView(Views.MESSAGES);
				await sleep(0);
				focusMessages();
			}}
			tabIndex={-1}
			classList={{
				[styles.dmItem]: true,
				focusable: true,
				// [styles.focused]: focused(),
				[styles.selected]: selected(),
				[styles.unread]: unread() > 0,

				["channel-" + props.$.id]: true,
			}}
		>
			<GroupDMIcon $={props.$} />
			<div class={styles.aside}>
				<div class={styles.overflow}>
					<MarqueeOrNot marquee={focused()}>
						<Show when={name()} fallback={<DMGroupDefaultName $={props.$} />}>
							{name()}
						</Show>
					</MarqueeOrNot>
				</div>
				<DMGroupMembersNumber $={props.$} />
			</div>
		</div>
	);
}

function DMChannels() {
	const dms = useStore(() => untrack(discordClientReady)!.dms.sorted);

	const currentUserID = untrack(discordClientReady)!.ready.user.id;

	return (
		<For each={dms()}>
			{(dm, index) => (
				<div classList={{ [styles.vListItem]: true, [styles.start]: index() == 0 }}>
					<CustomErrorBoundary>
						<Show
							when={dm instanceof DiscordGroupDMChannel}
							fallback={
								<Show
									when={
										dm instanceof DiscordDMChannel &&
										dm.recipients.value.filter((a) => a.id != currentUserID).length
									}
								>
									<DMItem $={dm} />
								</Show>
							}
						>
							<DMGroupItem $={dm} />
						</Show>
					</CustomErrorBoundary>
				</div>
			)}
		</For>
	);
}

function isChannelPrivate(channel: DiscordGuildTextChannel<any>) {
	const perms = useStore(() => channel, "permission_overwrites");
	const roles = useStore(() => channel.guild, "roles");
	const everyone = () => roles().find((p) => p.position == 0)?.id;

	const ft = () => perms()?.find((l) => l.id == everyone());

	return () => {
		if (!ft()) return false;
		return (+ft()!.deny & 1024) == 1024;
	};
}

function GuildChannelItemDecorations(props: { $: DiscordGuildTextChannel<any>; focused: boolean }) {
	const name = useStore(() => props.$, "name");

	const rulesChannelID = useStore(() => props.$.guild, "rules_channel_id");

	const isRulesChannel = () => rulesChannelID() == props.$.id;

	const ch_type = () =>
		isRulesChannel()
			? "rules"
			: props.$.type === 5
			? "announce"
			: isChannelPrivate(props.$)()
			? "limited"
			: "text";

	return (
		<>
			<div class={styles.indicator}></div>
			<div class={styles.icon}>
				<Dynamic component={ChannelIcons[ch_type()]} />
			</div>
			<div class={styles.text}>
				<MarqueeOrNot marquee={props.focused}>{name()}</MarqueeOrNot>
			</div>
		</>
	);
}

function GuildChannelItem(props: { $: DiscordGuildTextChannel<any>; mentionCount: number; unread: boolean }) {
	const [focused, setFocused] = createSignal(false);
	const selected = () => currentDiscordChannel() === props.$;

	return (
		<div
			onFocus={(e) => {
				setFocused(true);
				channelItemOnFocus(e);
			}}
			onKeyDown={channelItemKeydown}
			onBlur={() => setFocused(false)}
			on:sn-enter-down={async (e) => {
				e.currentTarget.blur();
				setCurrentDiscordChannel(props.$);
				if (props.unread) props.$.ack();
				channelHistory.set(props.$.guild, props.$);
				// await sleep(10);
				setCurrentView(Views.MESSAGES);
				await sleep(0);
				focusMessages();
			}}
			tabIndex={-1}
			classList={{
				[styles.chItem]: true,
				focusable: true,
				[styles.unread]: props.unread,
				[styles.selected]: selected(),
				["channel-" + props.$.id]: true,
			}}
		>
			<GuildChannelItemDecorations focused={focused()} $={props.$} />
			<Show when={props.mentionCount > 0}>
				<div class={styles.count}>{props.mentionCount}</div>
			</Show>
		</div>
	);
}

function CollapserChannelItemWithParent(props: {
	$: DiscordGuildTextChannel<any>;
	parent: string;
	unread: boolean;
	mentionCount: number;
}) {
	const [collapsed] = useStoredSignal(false, "ch-collapsed-" + props.parent);

	return (
		<Show when={!(collapsed() && !props.unread && currentDiscordChannel() != props.$)}>
			<GuildChannelItem mentionCount={props.mentionCount} unread={props.unread} $={props.$} />
		</Show>
	);
}

function CollapserChannelItem(props: { $: DiscordGuildTextChannel<any> }) {
	const mentionCount = useStore(() => props.$.readState, "mention_count");

	const parent = useStore(() => props.$, "parent_id");

	const readStateLastMessageID = useStore(() => props.$.readState, "last_message_id");

	const lastMessageID = useStore(() => props.$.lastMessageID);

	const unread = () =>
		mentionCount() > 0 ||
		(readStateLastMessageID() !== undefined && lastMessageID() !== readStateLastMessageID());

	return (
		<Show
			when={parent()}
			fallback={<GuildChannelItem mentionCount={mentionCount()} unread={unread()} $={props.$} />}
		>
			<CollapserChannelItemWithParent
				$={props.$}
				parent={parent()!}
				unread={unread()}
				mentionCount={mentionCount()}
			/>
		</Show>
	);
}

function GuildNameInChannels() {
	const name = useStore(() => currentDiscordGuild()!, "name");

	return <div class={styles.guildName}>{name()}</div>;
}

function ChannelsSeparatorCollapsable(props: { id: string | number; children: JSXElement }) {
	const [collapsed, setCollapsed] = useStoredSignal(false, "ch-collapsed-" + props.id);

	let nodeRef!: HTMLDivElement;

	return (
		<div
			ref={nodeRef}
			onFocus={(e) => {
				centerScroll(e.target as HTMLElement);
			}}
			onKeyDown={channelItemKeydown}
			on:sn-enter-down={async () => {
				setCollapsed((a) => !a);
				await sleep(0);
				centerScroll(nodeRef);
			}}
			tabIndex={-1}
			classList={{
				focusable: true,
				[styles.separator]: true,
				[styles.collapsed]: collapsed(),
			}}
		>
			<svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M5.3 9.3a1 1 0 0 1 1.4 0l5.3 5.29 5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z"
					class=""
				></path>
			</svg>
			{props.children}
		</div>
	);
}

function ChannelsSeparator(props: {
	/**
	 * required if it is a collapsible separator
	 */
	id?: string | number;
	children: JSXElement;
}) {
	return (
		<Show when={props.id} fallback={<div class={styles.separator}>{props.children}</div>}>
			<ChannelsSeparatorCollapsable id={props.id!}>{props.children}</ChannelsSeparatorCollapsable>
		</Show>
	);
}

function GuildCategory(props: { $: DiscordGuildChannelCategory }) {
	const name = useStore(() => props.$, "name");
	return <ChannelsSeparator id={props.$.id}>{name()}</ChannelsSeparator>;
}

function GuildChannels() {
	const channels = useStore(() => currentDiscordGuild()!.channels.sorted);

	return (
		<>
			<For each={channels()}>
				{(ch, index) => (
					<div classList={{ [styles.vListItem]: true, [styles.startGuild]: "readState" in ch && index() == 0 }}>
						<Show when={!index()}>
							<GuildNameInChannels />
						</Show>
						<Show when={"readState" in ch} fallback={<GuildCategory $={ch as DiscordGuildChannelCategory} />}>
							<CollapserChannelItem $={ch as any} />
						</Show>
					</div>
				)}
			</For>
		</>
	);
}

export default function Channels() {
	onMount(() => {
		SpatialNavigation.add("channels", {
			selector: `.${mainViewStyles.channels} .focusable`,
			rememberSource: true,
			restrict: "self-only",
			leaveFor: {
				left: "",
				right: "",
			},
		});

		preloadSearch();
	});

	onCleanup(() => {
		SpatialNavigation.remove("channels");
	});

	return (
		<div
			classList={{
				[mainViewStyles.channels]: true,
				[mainViewStyles.messagesInFocus]: currentView() == Views.MESSAGES,
				[mainViewStyles.channelsInFocus]: currentView() == Views.CHANNELS,
				[mainViewStyles.guildsInFocus]: currentView() == Views.GUILDS,
			}}
		>
			<Show when={currentDiscordGuild() == null} fallback={<GuildChannels />}>
				<DMChannels />
			</Show>
		</div>
	);
}

export function GroupDMIcon(props: { $: DiscordGroupDMChannel; class?: string; size?: number }) {
	const icon = useStore(() => props.$, "icon");
	const defaultAvatar = createMemo(
		() =>
			!icon() &&
			DEFAULT_GROUP_DM_AVATARS[convertSnowflakeToDate(props.$.id).getTime() % DEFAULT_GROUP_DM_AVATARS.length]
	);

	return (
		<img
			class={`${styles.avatar} ${props.class ?? ""}`}
			src={
				icon()
					? `https://cdn.discordapp.com/channel-icons/${props.$.id}/${icon()}.png?size=${props.size ?? 32}`
					: defaultAvatar() || ""
			}
		/>
	);
}

function RecipientAvatarStatusIcon(props: ComponentProps<"div"> & { $: DiscordUser }) {
	const presence = useStore(() => props.$.presence);

	const available = () =>
		Object.keys(presence().client_status || {}).filter((a) => {
			// @ts-ignore
			return presence().client_status?.[a as keyof GatewayPresenceClientStatus] == presence().status;
		});

	const client = () =>
		available().length ? available()[Math.floor(Math.random() * available().length)] : null;

	const icon = () =>
		presence().status === "offline"
			? StatusIcons["offline"]
			: StatusIcons[(client() + "_" + presence().status) as keyof typeof StatusIcons];

	return (
		<div class={styles.wrap}>
			<svg width="32" height="32" viewBox="0 0 32 32">
				<foreignObject
					x="0"
					y="0"
					width="32"
					height="32"
					// @ts-ignore
					mask={`url(#${client() === "mobile" ? client() : "round"}-avatar-status)`}
				>
					{props.children}
				</foreignObject>
			</svg>
			<img class={styles.status_icon} src={icon()} />
		</div>
	);
}

export function RecipientAvatar(props: {
	$: DiscordDMChannel;
	class?: string;
	size?: number;
	dmItem?: boolean;
}) {
	const client = props.$.$client;
	const currentUserID = client.ready.user.id;

	// this part should be reactive
	const recipients = useStore(() => props.$.recipients);

	// funny
	const user = () => recipients().find((a) => a.id != currentUserID);

	return (
		<Show when={user()}>
			<Show
				when={props.dmItem}
				fallback={
					<div style={{ padding: 0 }} class={`${styles.avatar} ${props.class}`}>
						<UserAvatar $={user()!} size={props.size} />
					</div>
				}
			>
				<RecipientAvatarStatusIcon $={user()!}>
					<div style={{ padding: 0 }} class={`${styles.avatar} ${props.class}`}>
						<UserAvatar $={user()!} size={props.size} />
					</div>
				</RecipientAvatarStatusIcon>
			</Show>
		</Show>
	);
}
