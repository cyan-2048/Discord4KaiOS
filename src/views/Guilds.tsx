import {
	Views,
	channelHistory,
	currentDiscordGuild,
	currentView,
	discordClientReady,
	imageFormatGuildIcon,
	setCurrentDiscordChannel,
	setCurrentDiscordGuild,
	setCurrentView,
	useStoredSignal,
} from "@/signals";
import * as mainViewStyles from "../MainView.module.scss";
import * as styles from "./Guilds.module.scss";
import SpatialNavigation from "@/lib/spatial_navigation";
import {
	Accessor,
	For,
	Match,
	Show,
	Switch,
	batch,
	createEffect,
	createMemo,
	createSignal,
	from,
	observable,
	onCleanup,
	onMount,
	untrack,
} from "solid-js";
import { centerScroll, decimal2rgb, sleep, useKeypress, useStore } from "@/lib/utils";

import ClydeIcon from "../icons/ClydeIcon.svg";
import FolderIcon from "../icons/FolderIcon.svg";

import {
	DiscordClientReady,
	DiscordDMChannel,
	DiscordGroupDMChannel,
	DiscordGuild,
	DiscordGuildTextChannel,
	shallowEqual,
} from "discord";
import { GroupDMIcon, RecipientAvatar } from "./Channels";
import { DiscordReadState } from "discord/src/ReadStateHandler";
import { Readable, Unsubscriber, readable } from "discord/src/lib/stores";
import { Portal } from "solid-js/web";
import Tooltip from "./components/Tooltip";
import { focusMessages } from "./Messages";
import { toast } from "./modals/toast";

function GuildIcon(props: { $: DiscordGuild; focused: boolean }) {
	const icon = useStore(() => props.$, "icon");
	const name = useStore(() => props.$, "name");
	// console.log("GuildIcon re-render");

	// console.log(props.$.$);

	return (
		<Show
			when={icon()}
			fallback={
				<div class={styles.guildIcon}>
					{name()
						.split(/\s+/)
						.map((a) => {
							let char = "";
							a.replace(/((^[A-z])|([^A-z]))/g, (a) => {
								char += a;
								return a;
							});
							return char;
						})
						.join("")}
				</div>
			}
		>
			{(icon) => (
				<img
					class={styles.guildIcon}
					title={props.$.value.name}
					src={`https://cdn.discordapp.com/icons/${props.$.id}/${icon()}.${
						props.focused && icon().startsWith("a_") ? "gif" : imageFormatGuildIcon()
					}?size=48`}
				/>
			)}
		</Show>
	);
}

function GuildIndicatorGuild(props: { $: DiscordGuild }) {
	const mentionCount = getGuildMentionCount(props.$);

	return (
		<div
			classList={{
				[styles.guildIndicator]: true,
				[styles.unread]: Number.isInteger(mentionCount()),
			}}
		></div>
	);
}

function GuildIndicatorArray(props: { $: Array<DiscordGuild> }) {
	const [unread, setUnread] = createSignal(false);

	createEffect(() => {
		const unsubs: Unsubscriber[] = [];
		const map = new Map<string, number | null>();

		let init = false;

		function updateUnread() {
			for (const v of map.values()) {
				if (v || v === 0) {
					setUnread(true);
					return;
				}
			}
			setUnread(false);
		}

		props.$.forEach((guild) => {
			const mentionCount = getGuildMentionCount(guild);
			unsubs.push(
				observable(mentionCount).subscribe((state) => {
					map.set(guild.id, state);

					if (init) {
						updateUnread();
					}
				}).unsubscribe
			);
		});

		updateUnread();
		init = true;

		onCleanup(() => {
			unsubs.forEach((e) => e());
		});
	});

	return <div classList={{ [styles.guildIndicator]: true, [styles.unread]: unread() }}></div>;
}

function GuildIndicator(props: {
	$: DiscordGuild | DiscordDMChannel | DiscordGroupDMChannel | Array<DiscordGuild> | null;
}) {
	return (
		<Switch fallback={<div class={styles.guildIndicator}></div>}>
			<Match when={Array.isArray(props.$)}>
				<GuildIndicatorArray $={props.$ as Array<DiscordGuild>} />
			</Match>
			<Match when={props.$ instanceof DiscordGuild}>
				<GuildIndicatorGuild $={props.$ as DiscordGuild} />
			</Match>
		</Switch>
	);
}

function MentionCount(props: {
	$: {
		readState: DiscordReadState;
	};
}) {
	const mentionCount = useStore(() => props.$.readState, "mention_count");
	return <div class={styles.guildPing}>{mentionCount()}</div>;
}

function DMPing(props: { $: DiscordDMChannel | DiscordGroupDMChannel }) {
	return (
		<div
			on:sn-enter-down={async (e) => {
				e.currentTarget.blur();
				setCurrentDiscordGuild(null);
				setCurrentDiscordChannel(props.$);

				// we move so that it'll be preserved when we go back to the guilds view
				console.log("move", SpatialNavigation.move("down") || SpatialNavigation.move("up"));

				await sleep(0);

				props.$.ack();

				// focus the channel
				SpatialNavigation.focus(`.${mainViewStyles.channels} .focusable.channel-${props.$.id}`);

				await sleep(0);
				setCurrentView(Views.MESSAGES);
				await sleep(0);
				focusMessages();
			}}
			onFocus={(e) => {
				centerScroll(e.currentTarget);
			}}
			class={styles.guildItem + " focusable"}
			tabIndex={-1}
		>
			<Show
				when={props.$ instanceof DiscordGroupDMChannel}
				fallback={<RecipientAvatar $={props.$} class={styles.guildIcon} size={48} />}
			>
				<GroupDMIcon $={props.$} class={styles.guildIcon} size={48} />
			</Show>

			<MentionCount $={props.$} />
			<GuildIndicator $={null} />
		</div>
	);
}

function DMPings() {
	const [pings, setPings] = createSignal<Array<DiscordDMChannel | DiscordGroupDMChannel>>([]);

	// reason for untrack is expected behavior is to unmount entire app when discord client is not ready
	const dms = useStore(() => untrack(discordClientReady)!.dms.sorted);

	function updatePings(dms: Array<DiscordDMChannel | DiscordGroupDMChannel>) {
		setPings((oldState) => {
			const newState = dms.filter((dm) => dm.readState.value.mention_count > 0);
			return shallowEqual(oldState, newState) ? oldState : newState;
		});
	}

	createEffect(async () => {
		pings(); // trigger the effect

		const current = document.activeElement as HTMLElement;

		if (current) {
			console.log("NEW PINGS CHANGE OCCURED");

			// this so that we force SN to re-calculate, i have no idea how to fix
			current.blur();
			await sleep(10);
			current.focus();
		}
	});

	createEffect(() => {
		const _dms = dms();
		const subs = _dms.map((dm) => dm.readState.subscribe(() => updatePings(_dms)));

		console.log("SUBBING");

		onCleanup(() => {
			console.log("UNSUBBING");
			subs.forEach((e) => e());
		});
	});

	return <For each={pings()}>{(p) => <DMPing $={p} />}</For>;
}

function DMGuild() {
	const isSelected = () => currentDiscordGuild() === null;

	return (
		<>
			<div
				on:sn-enter-down={async (e) => {
					e.currentTarget.blur();
					batch(() => {
						setCurrentDiscordGuild(null);
						const fromHistory = channelHistory.get(null) || null;
						setCurrentDiscordChannel(fromHistory);
					});

					setCurrentView(Views.CHANNELS);
					await sleep(0);
					SpatialNavigation.focus("channels");
				}}
				onFocus={(e) => {
					centerScroll(e.currentTarget);
				}}
				tabIndex={-1}
				id="dmGuild"
				classList={{ [styles.guildItem]: true, [styles.selected]: isSelected(), focusable: true }}
			>
				<div class={styles.guildIcon}>
					<ClydeIcon />
				</div>
				<GuildIndicator $={null} />
			</div>
			<DMPings />
			<div class={styles.separator}></div>
		</>
	);
}

let mentionCounts = new WeakMap<DiscordGuild, Readable<number | null>>();

/**
 * - returns `0` if there are no mentions but there is unread
 * - return `null` if there are no mentions and no unread
 */
function getGuildMentionCount(guild: DiscordGuild) {
	const has = mentionCounts.get(guild);
	if (has) return from(has) as Accessor<number | null>;

	const _readable = readable<number | null>(null, (set) => {
		const unsubs: Unsubscriber[] = [];

		const unsubFromSorted = guild.channels.sorted.subscribe((channels) => {
			// everytime the channels change, we need to re-subscribe
			unsubs.forEach((e) => e());
			const map = new Map<DiscordGuildTextChannel<any>, number>();

			function updateCount() {
				let count = 0,
					unread = false;

				map.forEach((mention_count, channel) => {
					count += mention_count;

					// if count is zero and not unread, find unread channels
					if (!count && !unread) {
						const readStateMessageID = channel.readState.value.last_message_id;
						unread = readStateMessageID !== undefined && channel.lastMessageID.value !== readStateMessageID;
					}
				});

				set(count || (unread ? 0 : null));
			}

			let init = false;

			channels.forEach((channel) => {
				if ("readState" in channel)
					unsubs.push(
						channel.readState.subscribe((state) => {
							map.set(channel, state.mention_count);

							if (init) {
								updateCount();
							}
						}),
						channel.lastMessageID.subscribe(() => {
							if (init) {
								updateCount();
							}
						})
					);
			});

			// init has to be set so that we are sure that the channels are all subscribed
			updateCount();
			init = true;
		});

		return () => {
			unsubs.forEach((e) => e());
			unsubFromSorted();
		};
	});

	mentionCounts.set(guild, _readable);

	return from(_readable) as Accessor<number | null>;
}

function GuildMentionCount(props: { $: DiscordGuild }) {
	const mentionCount = getGuildMentionCount(props.$);

	return (
		<Show when={mentionCount()}>
			<div class={styles.guildPing}>{mentionCount()}</div>
		</Show>
	);
}

function GuildItem(props: { $: DiscordGuild }) {
	const isSelected = () => currentDiscordGuild() === props.$;

	const [scrolledTo, setScrolledTo] = createSignal(false);
	const [tooltipTop, setTooltipTop] = createSignal<number | null>(null);

	const [focused, setFocused] = createSignal(false);

	return (
		<div
			tabIndex={-1}
			on:sn-enter-down={async (e) => {
				e.currentTarget.blur();

				batch(() => {
					setCurrentDiscordGuild(props.$);
					props.$.lazy();
					const fromHistory = channelHistory.get(props.$);
					setCurrentDiscordChannel(fromHistory || null);
				});

				await sleep(0);
				setCurrentView(Views.CHANNELS);
				SpatialNavigation.focus("channels");
			}}
			onBlur={() => {
				batch(() => {
					setFocused(false);
					setTooltipTop(null);
					setScrolledTo(false);
				});
			}}
			onFocus={(e) => {
				setFocused(true);

				const node = e.target as HTMLElement;
				centerScroll(node)
					.then(() => sleep(10))
					.then(() => {
						batch(() => {
							setScrolledTo(true);

							const rect = node.getBoundingClientRect();

							setTooltipTop(rect.top + node.clientHeight / 2);
						});
					});
			}}
			classList={{ [styles.guildItem]: true, focusable: true, [styles.selected]: isSelected() }}
		>
			<GuildIcon focused={focused()} $={props.$} />
			<Show when={focused() && scrolledTo()}>
				<Show when={tooltipCanBeShown()}>
					<Portal>
						<Tooltip y={tooltipTop()} x={72} maxWidth={window.innerWidth - (72 + 5)}>
							{props.$.value.name}
						</Tooltip>
					</Portal>
				</Show>
			</Show>
			<GuildMentionCount $={props.$} />
			<GuildIndicator $={props.$} />
		</div>
	);
}

// lmao
type DiscordGuildsFolder = Exclude<DiscordClientReady["guilds"]["sorted"]["value"][number], DiscordGuild>;

function GuildFolderGrid(props: { $: DiscordGuildsFolder }) {
	return (
		<div class={styles.grid}>
			<For each={props.$.guilds}>{(guild) => <GuildIcon focused={false} $={guild} />}</For>
		</div>
	);
}

function GuildFolderClosedIcon(props: { $: DiscordGuildsFolder }) {
	const color = props.$.color;

	return (
		<div
			style={{
				"background-color": `rgba(${color ? decimal2rgb(color, true) : [88, 101, 242]},0.5)`,
			}}
			classList={{ [styles.guildIcon]: true, [styles.folderIcon]: true }}
		>
			<GuildFolderGrid $={props.$} />
		</div>
	);
}

function GuildFolderMentionCount(props: { $: DiscordGuild[] }) {
	const [mentionCount, setCount] = createSignal(0);

	createEffect(() => {
		const unsubs: Unsubscriber[] = [];
		const map = new Map<string, number | null>();

		let init = false;

		function updateCount() {
			let count = 0;

			for (const v of map.values()) {
				if (v) count += v;
			}

			setCount(count);
		}

		props.$.forEach((guild) => {
			const mentionCount = getGuildMentionCount(guild);
			unsubs.push(
				observable(mentionCount).subscribe((state) => {
					map.set(guild.id, state);

					if (init) {
						updateCount();
					}
				}).unsubscribe
			);
		});

		updateCount();
		init = true;

		onCleanup(() => {
			unsubs.forEach((e) => e());
		});
	});

	return (
		<Show when={mentionCount()}>
			<div class={styles.guildPing}>{mentionCount()}</div>
		</Show>
	);
}

function GuildFolderClosed(props: { $: DiscordGuildsFolder; setOpen: (open: boolean) => void }) {
	return (
		<div
			onFocus={(e) => {
				centerScroll(e.target as HTMLElement);
			}}
			on:sn-enter-down={async (e) => {
				e.currentTarget.blur();

				props.setOpen(true);
				await sleep(0);
				SpatialNavigation.focus(`.folder-${props.$.id}`);
			}}
			tabIndex={-1}
			classList={{ [styles.guildItem]: true, focusable: true, ["folder-" + props.$.id]: true }}
		>
			<GuildFolderClosedIcon $={props.$} />
			<GuildFolderMentionCount $={props.$.guilds} />
			<GuildIndicator $={props.$.guilds} />
		</div>
	);
}

function CollapseFolderIcon(props: { $: DiscordGuildsFolder; setOpen: (open: boolean) => void }) {
	return (
		<div
			onFocus={(e) => {
				centerScroll(e.target as HTMLElement);
			}}
			on:sn-enter-down={async () => {
				props.setOpen(false);
				await sleep(0);
				SpatialNavigation.focus(`.folder-${props.$.id}`);
			}}
			tabIndex={-1}
			classList={{
				[styles.guildItem]: true,
				[styles.folderCollapse]: true,
				focusable: true,
				["folder-" + props.$.id]: true,
			}}
		>
			<div
				classList={{ [styles.guildIcon]: true, [styles.folderIcon]: true }}
				style={{
					color: typeof props.$.color == "number" ? `rgb(${decimal2rgb(props.$.color, true)})` : "#5865f2",
				}}
			>
				<FolderIcon />
			</div>
			<GuildIndicator $={null} />
		</div>
	);
}

function GuildFolder(props: { $: DiscordGuildsFolder }) {
	const [open, setOpen] = useStoredSignal(false, `guilds-folder-opened-${props.$.id}`);

	return (
		<Show when={open()} fallback={<GuildFolderClosed setOpen={setOpen} $={props.$} />}>
			<div class={styles.folderWrap}>
				<CollapseFolderIcon setOpen={setOpen} $={props.$} />
				<For each={props.$.guilds}>{(guild) => <GuildItem $={guild} />}</For>
			</div>
		</Show>
	);
}

function GuildItems() {
	const state = useStore(() => untrack(discordClientReady)!.guilds.sorted);

	createEffect(() => {
		state();

		const currentGuild = untrack(currentDiscordGuild);

		// if we are currently not in a guild, leaving guilds doesn't matter
		if (!currentGuild) return;

		const guildExists = untrack(discordClientReady)!.guilds.get(currentGuild.id);

		// if the current guild is no longer in the jar, we probably should clear up some things
		if (!guildExists) {
			// let's clear a bit of RAM
			mentionCounts.delete(currentGuild);

			batch(() => {
				setCurrentDiscordGuild(null);
				setCurrentDiscordChannel(null);
			});
		}
	});

	return (
		<For each={state()}>
			{(item) => (
				<Show when={"guild_ids" in item} fallback={<GuildItem $={item as DiscordGuild} />}>
					<GuildFolder $={item as DiscordGuildsFolder} />
				</Show>
			)}
		</For>
	);
}

const [tooltipCanBeShown, setTooltipCanBeShown] = createSignal(false);

export default function Guilds() {
	const guildsInView = createMemo(() => currentView() == Views.GUILDS);

	createEffect(() => {
		const inView = guildsInView();

		if (!inView) return setTooltipCanBeShown(false);

		const timeout = setTimeout(() => {
			setTooltipCanBeShown(inView ? true : false);
		}, 300);
		onCleanup(() => clearTimeout(timeout));
	});

	onMount(() => {
		SpatialNavigation.add("guilds", {
			selector: `.${mainViewStyles.guilds} .focusable`,
			rememberSource: true,
			restrict: "self-only",
		});
		SpatialNavigation.focus("guilds");
	});

	onCleanup(() => {
		SpatialNavigation.remove("guilds");

		// according to mdn this is how you clear a weakmap, weird
		mentionCounts = new WeakMap();
	});

	let warned = false;

	useKeypress(["ArrowRight", "Backspace"], async (e) => {
		if (untrack(currentView) == Views.GUILDS) {
			if (e.key === "ArrowRight") {
				setCurrentView(Views.CHANNELS);
				await sleep(0);
				SpatialNavigation.focus("channels");
			} else {
				if (!warned)
					setTimeout(() => {
						warned = false;
					}, 3000);

				if (warned) return window.close();
				warned = true;
				toast("Press backspace again to close the app");
			}
		}
	});

	return (
		<div
			classList={{
				[mainViewStyles.guilds]: true,
				[mainViewStyles.messagesInFocus]: currentView() == Views.MESSAGES,
				[mainViewStyles.channelsInFocus]: currentView() == Views.CHANNELS,
				[mainViewStyles.guildsInFocus]: currentView() == Views.GUILDS,
			}}
		>
			<DMGuild />
			<GuildItems />
		</div>
	);
}
