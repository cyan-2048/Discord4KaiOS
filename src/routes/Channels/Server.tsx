import styles from "./Server.module.scss";
import _channelsStyles from "./Channels.module.scss";

import { useReadable, useMemoryState, useMount } from "@lib/hooks";
import { decimal2rgb, clx, centerScroll } from "@lib/utils";
import { Guild } from "discord/Guilds";
import { GuildFolder, RawGuild, ReadState } from "discord/types";
import { FunctionComponent } from "preact";
import { route } from "preact-router";
import { PureComponent, memo } from "preact/compat";
import { useState, useRef, useReducer, useEffect, useCallback } from "preact/hooks";
import { UIFolder, guildID, siftTheSiftedChannelsBruh, focusedChannel, pageState, noChannelsFound } from "./shared";

const ServerMentions: FunctionComponent = (props) => <div class={styles.ServerMentions}>{props.children}</div>;

export const ServerFolder = memo(({ servers, props }: UIFolder) => {
	const [open, setOpen] = useState(false);

	const mentionsArr = useRef<number[]>([]);
	const unreadsArr = useRef<boolean[]>([]);

	const [mentions, updateMentions] = useReducer((state, [index, value]: [number, number]) => {
		const arr = mentionsArr.current;
		arr[index] = value;
		return arr.reduce((a, b) => a + b, 0);
	}, 0);

	const [unread, updateUnreads] = useReducer((state, [index, value]: [number, boolean]) => {
		const arr = unreadsArr.current;
		arr[index] = value;
		return arr.some((a) => a);
	}, false);

	const toggleEl = useRef<HTMLDivElement>(null);
	const mainEl = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (open) {
			toggleEl.current?.focus();
			centerEl(toggleEl.current);
		} else {
			mainEl.current?.focus();
		}
	}, [open]);

	const toggleOpenKeydown = useCallback((e: KeyboardEvent) => {
		if (e.target === e.currentTarget && e.key === "Enter") setOpen((open) => !open);
	}, []);

	return (
		<main
			ref={mainEl}
			tabIndex={0}
			style={!open ? `background-color: rgba(${props.color ? decimal2rgb(props.color, true) : [88, 101, 242]},0.3)` : null}
			data-name={props.name}
			data-focusable={open ? null : ""}
			data-folder=""
			class={clx({ [styles.ServerFolder]: 1, [styles.open]: open, [styles.unread]: unread })}
			//onClick={() => setOpen(!open)}
			onKeyDown={toggleOpenKeydown}
		>
			<div class={styles.hover} />
			{open && (
				<div ref={toggleEl} onKeyDown={toggleOpenKeydown} tabIndex={0} data-focusable="" class={styles["folder-toggle"]}>
					<div class={styles.hover} />
				</div>
			)}
			{servers.map((server, i) => (
				<Server
					focusable={open}
					guild={server}
					selected={guildID.value === server.id}
					setMention={useCallback((val) => updateMentions([i, val]), [i])}
					setUnread={useCallback((val) => updateUnreads([i, val]), [i])}
				/>
			))}
			{mentions > 0 && !open && <ServerMentions>{mentions}</ServerMentions>}
		</main>
	);
});

const shorten = (e: string) =>
	e
		?.split(" ")
		.map((a) => a[0])
		.join("")
		.slice(0, 3) || "";

const centerEl = (el: HTMLElement, sync = false) => {
	return centerScroll(el, sync, {
		isScrollable(target: HTMLElement) {
			return Boolean(target.classList?.contains(_channelsStyles.servers));
		},
	});
};

const Server = memo(
	({
		focusable = true,
		guild,
		selected,
		setMention,
		setUnread,
	}: {
		focusable?: boolean;
		selected?: boolean;
		guild: Guild;
		setMention?: (mentions: number) => void;
		setUnread?: (unread: boolean) => void;
	}) => {
		const props: RawGuild = useReadable(guild.props);

		const [mentions, _setMentions] = useMemoryState("mentions-" + props.id, 0);
		const [unread, _setUnreads] = useMemoryState("unread-" + props.id, false);

		function setMentions(arg: number) {
			_setMentions(arg);
			setMention?.(arg);
		}

		function setUnreads(arg: boolean) {
			_setUnreads(arg);
			setUnread?.(arg);
		}

		const guildChannels = useReadable(guild.channels.siftedChannels);

		useEffect(() => {
			const _channels = siftTheSiftedChannelsBruh(guildChannels).filter((a) => a.readState && !a.isMuted() && [5, 0].includes(a.type));

			const unreads: boolean[] = [];
			const mentions: number[] = [];

			const unsubs = _channels.map((a, i) => {
				const unsub1 = a.unread.subscribe((val: boolean) => {
					unreads[i] = val;
					setUnreads(unreads.some((a) => a));
				});

				const unsub2 = a.readState.subscribe((val: ReadState) => {
					mentions[i] = val.mention_count;
					setMentions(mentions.reduce((a, b) => a + b, 0));
				});

				return () => {
					unsub1();
					unsub2();
				};
			});

			/*
		const unsubs: (() => void)[] = _channels.map((a) =>
			a.readState.subscribe((val: ReadState) => {
				states.add(val);
				// @ts-ignore
				const _mentions = [...states].map((a: ReadState) => a.mention_count).reduce((a, b) => a + b, 0);
				setMentions(_mentions);

				if (_mentions) {
					setUnreads(true);
					return;
				}

				if (guild.isMuted()) return setUnreads(false);

				for (let i = 0; i < _channels.length; i++) {
					const _channel = _channels[i];
					// (unread && !muted) || mentions > 0,
					if (!_channel.isMuted() && get(_channel.unread)) {
						setUnreads(true);
						return;
					}
				}

				setUnreads(false);
			})
		);
		*/
			return () => unsubs.forEach((a) => a());
		}, [guildChannels]);

		const animated = Boolean(props.icon?.startsWith("a_"));

		const [focused, setFocused] = useState(false);

		const mainEl = useRef<HTMLDivElement>(null);

		useMount(() => {
			selected && centerEl(mainEl.current, true);
		});

		return (
			<main
				key={guild.id}
				onClick={() => {
					route("/channels/" + guild.id);
				}}
				ref={mainEl}
				onFocus={(e) => {
					if (e.target !== e.currentTarget) return;
					setFocused(true);
					centerEl(mainEl.current);
				}}
				onBlur={() => setFocused(false)}
				onKeyDown={(e) => {
					if (e.target !== e.currentTarget) return;
					if (["Enter", "SoftRight", "ArrowRight"].includes(e.key)) {
						route("/channels/" + guild.id);
						pageState.value = 1;
						guild.lazy();
					}
				}}
				data-focusable={focusable ? "" : null}
				class={clx({ [styles.Server]: 1, [styles.selected]: selected, [styles.unread]: unread, focused })}
				tabIndex={focusable ? 0 : null}
			>
				{focusable && <div class={styles.hover} />}
				{props.icon ? (
					<div
						class={styles.image}
						style={{
							"--image": `url(https://cdn.discordapp.com/icons/${guild.id}/${props.icon}.${animated && focused ? "gif" : "png"}?size=48)`,
						}}
					/>
				) : (
					<div class={styles.image} data-name={shorten(props.name)} />
				)}

				{mentions > 0 && focusable && <ServerMentions>{mentions}</ServerMentions>}
			</main>
		);
	}
);

export class DMasGuild extends PureComponent<{ selected: boolean }> {
	shouldComponentUpdate(nextProps: Readonly<{ selected: boolean }>): boolean {
		return this.props.selected !== nextProps.selected;
	}

	state = {
		_: false,
	};

	setFocused(_: boolean) {
		this.setState({ _ });
	}

	onKeyDown = (e: KeyboardEvent) => {
		if (e.target !== e.currentTarget) return;
		if (["Enter", "SoftRight", "ArrowRight"].includes(e.key)) {
			route("/channels/@me");
			noChannelsFound();
			// pageState.value = 1;
		}
	};

	render() {
		const { selected } = this.props;
		const { _: focused } = this.state;

		return (
			<main
				tabIndex={0}
				data-focusable=""
				class={clx({ [styles.selected]: selected, [styles.Server]: 1, [styles.dm]: 1, focused })}
				onFocus={() => this.setFocused(true)}
				onBlur={() => this.setFocused(false)}
				onKeyDown={this.onKeyDown}
			>
				<div class={styles.hover}></div>
				<div class={styles.image} data-name="" />
			</main>
		);
	}
}

export default Server;
