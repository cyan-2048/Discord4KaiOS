import styles from "./Channels.module.scss";

import { useMountDebug, useMemo, useRef, useMount, bindToWindow } from "@hooks";
import { Guild } from "discord/Guilds";
import { Readable, get } from "discord/main";
import Channel from "./Channel";
import { focusedChannel, siftTheSiftedChannelsBruh, guildID, noChannelsFound, pageState } from "./shared";
import { Fragment, FunctionComponent, JSX } from "preact";
import VirtualList from "@/components/VirtualList";
import { sleep } from "@/lib/utils";

export const ChannelSeparator: FunctionComponent<{ index?: number }> = (props) => (
	<div class={styles.separator} data-index={props.index}>
		{props.children}
	</div>
);

export async function focusCurrentChannel() {
	await sleep(50);
	const e = document.querySelector(`.${styles.channels} [data-index="${focusedChannel.peek()}"]`) as HTMLDivElement;
	console.log("SHOULD FOCUSE");
	e?.focus();
}

function findIndexStartingFrom<T>(array: T[], searchElement: (val: T) => boolean, startIndex: number) {
	for (let i = startIndex; i < array.length; i++) {
		if (searchElement(array[i])) {
			return i;
		}
	}
	return -1;
}

function findIndexStartingFromBackwards<T>(array: T[], searchElement: (val: T) => boolean, startIndex: number) {
	for (let i = startIndex; i >= 0; i--) {
		if (searchElement(array[i])) {
			return i;
		}
	}
	return -1;
}

const findChannel = (a: JSX.Element) => a.props.children.type === Channel;

function ServerChannelList({ guilds }: { guilds: Guild[] }) {
	useMountDebug("ServerChannelList");

	useMount(() =>
		pageState.subscribe(async (value) => {
			if (value === 1) {
				focusCurrentChannel();
			}
		})
	);

	const channels = useMemo(() => {
		const _channels = siftTheSiftedChannelsBruh(safeGetReadable(guilds.find((a) => a.id == guildID.peek())?.channels.siftedChannels))?.map((a, i) => {
			if ([5, 0].includes(a.type)) {
				return (
					<Fragment key={a.id}>
						<Channel index={i} channel={a} />
					</Fragment>
				);
			} else if (a.type == 4) {
				return (
					<Fragment key={a.id}>
						<ChannelSeparator index={i}>{a.name}</ChannelSeparator>
					</Fragment>
				);
			} else {
				console.log(a);
				return <div>{a.name}</div>;
			}
		});

		focusedChannel.value = findIndexStartingFrom(_channels || [], findChannel, 0);

		return _channels || [];
	}, [guildID.value]);

	bindToWindow("keydown", async (e) => {
		if (!pageState.peek()) return;
		let nextIndex: number = -1;

		const currentIndex = focusedChannel.peek();

		if (e.key == "ArrowDown") {
			nextIndex = findIndexStartingFrom(channels, findChannel, currentIndex + 1);
		} else if (e.key == "ArrowUp") {
			nextIndex = findIndexStartingFromBackwards(channels, findChannel, currentIndex - 1);
		}
		if ((e.key == "ArrowDown" || e.key == "ArrowUp") && nextIndex == -1) {
			focusCurrentChannel();
		}

		console.log(nextIndex);
		if (nextIndex != -1) {
			focusedChannel.value = nextIndex;
			focusCurrentChannel();
		}
	});

	return <VirtualList range={7} focusedIndex={focusedChannel.value} items={channels} />;
}

function safeGetReadable<T>(r?: Readable<T>) {
	return r ? get(r) : undefined;
}

export default ServerChannelList;
