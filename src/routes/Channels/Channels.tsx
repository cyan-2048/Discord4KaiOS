import styles from "./Channels.module.scss";
import _serverStyles from "./Server.module.scss";

import { sleep, clx } from "@utils";
import { useSpatialNav, useCallback, useEffect, useMemo, useRef, useState, useMount } from "@hooks";
import { discordInstance, RouteProps, sn } from "@shared";

import { Guild } from "discord/Guilds";

import { FunctionComponent, h } from "preact";
import { route } from "preact-router";
import Button from "@components/Button";
import Server, { DMasGuild, ServerFolder } from "./Server";
import { guildID, UIFolder, serversSN, channelsSN, pageState } from "./shared";
import ServerChannelList, { ChannelSeparator, focusCurrentChannel } from "./ChannelList";

/*
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
*/

window.onkeydown = ({ key }) => void (key == "0" && document.querySelector("button")?.click());

/*
class _Channels extends Component<RouteProps<{ hidden?: boolean; channelID: string; guildID: string }>> {
	constructor(props) {
		super(props);
	}

	render(
		{ channelID, guildID: _guildID, hidden, ...props }: RenderableProps<RouteProps<{ hidden?: boolean; channelID: string; guildID: string }>, any>,
		state?: Readonly<{}>,
		context?: any
	): ComponentChild {
		return (
			<main style={{ visibility: hidden ? "hidden" : null }} class="Channels">
				<div class={clx({ servers: 1, hidden: pageState.value == 1 })}>
					<div data-servers="">
						<DMasGuild selected={_guildID == "@me"}></DMasGuild>
						{guildsList}
					</div>
				</div>
				<div
					onKeyDown={(e) => {
						if (["ArrowLeft", "SoftLeft", "Backspace"].includes(e.key)) {
							e.stopImmediatePropagation();
							e.stopPropagation();
							e.preventDefault();
							pageState.value = 0;
						}
					}}
					ref={channelsEl}
					class="channels"
				>
					{_guildID == "@me" ? <ChannelSeparator>DIRECT MESSAGES</ChannelSeparator> : <ServerChannelList guilds={guilds} />}
					<Button onClick={useCallback(() => route("/test"), [])}>{"Test Route"}</Button>
				</div>
			</main>
		);
	}
}
*/

export default function Channels({ channelID, guildID: _guildID, hidden, ...props }: RouteProps<{ hidden?: boolean; channelID: string; guildID: string }>) {
	const discord = discordInstance.value;

	const guilds: Guild[] = useMemo(() => discord.gateway.guilds?.getAll() || [], [discord]);

	const channelsEl = useRef<HTMLDivElement>(null);

	const [guildsList, setGuildList] = useState<h.JSX.Element[]>(null);

	useMount(() =>
		pageState.subscribe(async (val) => {
			if (val === 0) {
				console.log("FOCUSING ON THE SERVERS");
				await sleep(100);
				sn.focus(serversSN);
				console.log(document.activeElement);
			}
		})
	);

	useEffect(() => {
		if (!guilds) return;
		const servers: (UIFolder | Guild)[] = [];
		const serverFolders = discord.gateway.user_settings.guild_folders;
		const arrangment = serverFolders.map((a) => a.guild_ids).flat();

		const indexer = ({ id }: Guild) => arrangment.indexOf(id);

		[...guilds]
			.sort((a, b) => indexer(a) - indexer(b))
			.forEach((a) => {
				const folder = serverFolders.find((e) => e.id && e.guild_ids?.includes(a.id));
				if (folder) {
					const found = servers.find((a: UIFolder) => a.type === "folder" && a.props.id === folder.id) as UIFolder;
					found
						? found.servers.push(a)
						: servers.push({
								type: "folder",
								servers: [a],
								props: folder,
						  });
				} else servers.push(a);
			});

		setGuildList(servers.map((a) => (a instanceof Guild ? <Server selected={guildID.value === a.id} guild={a} /> : <ServerFolder {...a} />)));
	}, [guilds]);

	useEffect(() => {
		guildID.value = _guildID;
	}, [channelID, _guildID]);

	useEffect(() => {
		if (!hidden && pageState.peek() === 1) {
			focusCurrentChannel();
		}
	}, [hidden]);

	useSpatialNav({
		id: serversSN,
		selector: `.${styles.Channels} .${styles.servers} [data-focusable]`,
		defaultElement: "." + _serverStyles.selected,
		restrict: "self-only",
	});

	return (
		<main style={{ visibility: hidden ? "hidden" : null }} class={styles.Channels}>
			<div class={clx({ [styles.servers]: 1, [styles.hidden]: pageState.value == 1 })}>
				<div data-servers="">
					<DMasGuild selected={_guildID == "@me"}></DMasGuild>
					{guildsList}
				</div>
			</div>
			<div
				onKeyDown={(e) => {
					if (["ArrowLeft", "SoftLeft", "Backspace"].includes(e.key)) {
						e.stopImmediatePropagation();
						e.stopPropagation();
						e.preventDefault();
						pageState.value = 0;
					}
				}}
				// onFocus={(e) => {
				// 	const el = e.target as HTMLElement;
				// 	centerScroll(el);
				// 	el.classList.add("focused");
				// }}
				// onBlur={(e) => {
				// 	const el = e.target as HTMLElement;
				// 	if (pageState.value == 1 && !hidden) {
				// 		el.classList.remove("focused");
				// 	}
				// }}
				ref={channelsEl}
				class={styles.channels}
			>
				{_guildID == "@me" ? <ChannelSeparator>DIRECT MESSAGES</ChannelSeparator> : <ServerChannelList guilds={guilds} />}
				<Button onClick={useCallback(() => route("/test"), [])}>{"Test Route"}</Button>
			</div>
		</main>
	);
}
