import "./style.scss";
import "./Server.scss";
import "./Channel.scss";

import { centerScroll, useMemoryState, useMount, useMountDebug, useReadable, useSpatialNav } from "@/lib/utils";
import { discordInstance, RouteProps, sn } from "@lib/shared";

import { Guild } from "discord/Guilds";
import { RawGuild, ReadState } from "discord/libs/types";
import { GuildChannel } from "discord/GuildChannels";

import clx from "obj-str";
import { Fragment, h } from "preact";
import { route } from "preact-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { get, Readable } from "discord";
import Button from "@/components/Button";

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

const ChannelSeparator = (props) => <div class="__separator">{props.children}</div>;

function _Channel({ avatar, status, id, muted, mentions, unread, client, ch_type, subtext, name, children }: any) {
	return (
		<main
			data-focusable=""
			tabIndex={0}
			id={`channel${id}`}
			class={`${avatar ? "dm" : ""} ${muted && mentions == 0 ? "muted" : ""} ${(unread && !muted) || mentions > 0 ? "unread" : ""}`}
		>
			{avatar ? (
				<div class="avatar">
					<img src={avatar} alt="" />
					{status && (
						<div
							class={`status ${client === "mobile" && status !== "offline" ? "mobile" : ""}`}
							style={`background-image:url(/css/status/${status !== "offline" ? client + "_" : ""}${status}.png);`}
						/>
					)}
				</div>
			) : (
				<>
					<div class="bar" />
					{ChannelIcons[ch_type as keyof typeof ChannelIcons]}
				</>
			)}

			{!isNaN(mentions) && mentions > 0 && (
				<div class="mentions">
					<div class={String(mentions).length > 2 ? "flow" : ""}>{mentions}</div>
				</div>
			)}
			{subtext && <div class="subtext">{subtext}</div>}
			<div class="text">{name ? name : children}</div>
		</main>
	);
}

interface ServerChannelProps {
	channel: GuildChannel;
	onFocus?: (e: FocusEvent) => void;
	onBlur?: () => void;
	class?: string;
}

/* For Channels in Servers aka not DMS */
function ServerChannel({ channel, class: _class = "", ..._props }: ServerChannelProps) {
	const props = useReadable(channel.props);

	const readState = safeGetReadable(channel.readState);
	const unread = Boolean(safeGetReadable(channel.unread));
	const muted = useMemo(() => channel.isMuted(), [channel]);
	const mentions = readState?.mention_count || 0;

	const ch_type = props.type === 5 ? "announce" : channel.isPrivate() ? "limited" : "text";

	return (
		<main
			data-focusable=""
			tabIndex={0}
			id={`channel${channel.id}`}
			class={`Channel__ ${muted && mentions == 0 ? "muted" : ""} ${(unread && !muted) || mentions > 0 ? "unread" : ""} ${_class}`}
			{..._props}
		>
			<div class="bar" />
			{ChannelIcons[ch_type as keyof typeof ChannelIcons]}
			{mentions > 0 && (
				<div class="mentions">
					<div class={String(mentions).length > 2 ? "flow" : ""}>{mentions}</div>
				</div>
			)}
			<div class="text">{props.name}</div>
		</main>
	);
}

function ServerFolder({ guildID, ...props }: any) {
	return <div>ServerFolder</div>;
}

const shorten = (e: string) =>
	e
		?.split(" ")
		.map((a) => a[0])
		.join("")
		.slice(0, 3) || "";

function Server({ selected = false, focusable = true, guild, setPage }: { focusable?: boolean; selected?: boolean; guild: Guild; setPage: (page: 0 | 1) => void }) {
	const props: RawGuild = useReadable(guild.props);

	const [mentions, setMentions] = useMemoryState("mentions-" + props.id, 0);
	const [unread, setUnread] = useMemoryState("unread-" + props.id, false);

	useMount(() => {
		const guildChannels = get(guild.channels.siftedChannels);
		const states = new Set<ReadState>();
		const _channels = guildChannels.filter((a) => a.readState && !a.isMuted());
		const readStates = _channels.map((a) => a.readState);
		const unsubs: (() => void)[] = readStates.map((a) =>
			a.subscribe((val: ReadState) => {
				states.add(val);
				// @ts-ignore
				const _mentions = [...states].map((a: ReadState) => a.mention_count).reduce((a, b) => a + b, 0);
				setMentions(_mentions);

				if (_mentions) {
					setUnread(true);
					return;
				}

				if (guild.isMuted()) return;

				for (let i = 0; i < _channels.length; i++) {
					const _channel = _channels[i];
					if (get(_channel.unread)) {
						setUnread(true);
						return;
					}
				}

				setUnread(false);
			})
		);
		return () => unsubs.forEach((a) => a());
	});

	const animated = useMemo(() => Boolean(props.icon?.startsWith("a_")), [props.icon]);

	const [focused, setFocused] = useState(false);

	const mainEl = useRef<HTMLDivElement>(null);

	const centerEl = useCallback(
		function (sync = false) {
			const el = mainEl.current;
			return centerScroll(el, sync, {
				isScrollable(target: HTMLElement) {
					return Boolean(target.classList?.contains("servers"));
				},
			});
		},
		[mainEl]
	);

	useMount(() => {
		selected && centerEl(true);
	});

	return (
		<main
			data-mentions={mentions}
			onClick={() => {
				route("/channels/" + guild.id);
			}}
			ref={mainEl}
			onFocus={() => {
				setFocused(true);
				centerEl();
			}}
			onBlur={() => setFocused(false)}
			onKeyDown={(e) => {
				if (["Enter", "SoftRight", "ArrowRight"].includes(e.key)) {
					route("/channels/" + guild.id);
					setPage(1);
				}
			}}
			data-focusable={focusable ? "" : null}
			class={"Server__ " + clx({ selected, unread, focused })}
			tabIndex={0}
		>
			{focusable && <div class="hover" />}
			{props.icon ? (
				<div class="image" style={{ "--image": `url(https://cdn.discordapp.com/icons/${guild.id}/${props.icon}.${animated && focused ? "gif" : "png"}?size=48)` }} />
			) : (
				<div class="image" data-name={shorten(props.name)} />
			)}

			{mentions > 0 && focusable && <div class="ServerMentions__">{mentions}</div>}
		</main>
	);
}

const pageStateSymbol = Symbol();

window.onkeydown = ({ key }) => key == "0" && void document.querySelector("button").click();

function ServerChannelList({ guildID, guilds }: { guildID: string; guilds: Guild[] }) {
	useMountDebug("ServerChannelList");
	const channels = useMemo(
		() =>
			safeGetReadable(guilds.find((a) => a.id == guildID)?.channels.siftedChannels)
				?.filter((a) => {
					if (a.type === 0 || a.type == 5) {
						const perms = a.roleAccess();
						return perms.read;
					}
					return true;
				})
				.filter((a, i, arr) => {
					if (a.type == 4) {
						const next = arr[i + 1];
						if (!next || next.type == 4) return false;
					}
					return true;
				})
				.map((a, i) => {
					if ([5, 0].includes(a.type)) {
						return (
							<ServerChannel
								onFocus={async (e) => {
									await centerScroll(e.target as HTMLElement);
								}}
								channel={a}
							/>
						);
					} else if (a.type == 4) {
						return <ChannelSeparator>{a.name}</ChannelSeparator>;
					} else {
						console.log(a);
						return <div>{a.name}</div>;
					}
				}),
		[guildID]
	);

	return <>{channels}</>;
}

var channelsSN = "channels" + Math.random().toString().slice(3);
var serversSN = "servers" + Math.random().toString().slice(3);

function safeGetReadable<T>(r?: Readable<T>) {
	return r ? get(r) : undefined;
}

export default function Channels({ channelID, guildID, hidden, ...props }: RouteProps<{ hidden?: boolean; channelID: string; guildID: string }>) {
	const discord = discordInstance.value;

	const guilds: Guild[] = useMemo(() => discord.gateway.guilds.getAll(), [discord]);

	const [pageState, setPageState] = useMemoryState<0 | 1>(pageStateSymbol, 0);

	useSpatialNav(
		{
			id: serversSN,
			selector: ".Channels__ .servers [data-focusable]",
			defaultElement: ".selected",
			restrict: "self-only",
		},
		{
			id: channelsSN,
			selector: ".Channels__ .channels [data-focusable]",
			restrict: "self-only",
			defaultElement: ".focused",
		}
	);

	useEffect(() => {
		sn.focus(pageState ? channelsSN : serversSN);
	}, [pageState, hidden]);

	const channelsEl = useRef<HTMLDivElement>(null);

	return (
		<>
			<main style={{ visibility: hidden ? "hidden" : null }} hidden={hidden} class="Channels__">
				<div class={clx({ servers: 1, hidden: pageState == 1 })}>
					<div data-servers="">
						{guilds.map((a) => (
							<Server setPage={setPageState} selected={a.id == guildID} guild={a} />
						))}
					</div>
				</div>
				<div
					onKeyDown={(e) => {
						if (e.key == "ArrowLeft") {
							setPageState(0);
						}
					}}
					onFocus={(e) => {
						const el = e.target as HTMLElement;
						centerScroll(el);
						el.classList.add("focused");
					}}
					onBlur={(e) => {
						const el = e.target as HTMLElement;
						if (pageState == 1 && !hidden) {
							el.classList.remove("focused");
						}
					}}
					ref={channelsEl}
					class="channels"
				>
					{guildID == "@me" && <ChannelSeparator>DIRECT MESSAGES</ChannelSeparator>}
					<ServerChannelList guilds={guilds} guildID={guildID} />
					<Button onClick={() => route("/test")}>Test Route Change</Button>
				</div>
			</main>
		</>
	);

	/*
	return (
		<>
			<main>
				<div class="servers">
					<div data-servers>
						<ServerFolder />
						<Server selected={guildID === "e"} server={null} />
					</div>
				</div>

				<div data-channels class={clx({ channels: true, guildID: guildID !== "@me", selected: false })}>
					{guildID != "@me" && (
						<div class={"header " + "selected"}>
							<div>{"guildName"}</div>
						</div>
					)}
					{guildID == "@me" && <div class="Channels__separator">DIRECT MESSAGES</div>}

					
					<Channel>{"channel.name" || ""}</Channel>
					<div className="Channels__separator">{"channel.name"}</div>
				</div>
			</main>
		</>
	);
	*/
}
