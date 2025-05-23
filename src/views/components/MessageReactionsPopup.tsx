import { DiscordGuild, DiscordMessage, DiscordUser } from "discord";
import * as styles from "./MessageReactionsPopup.module.scss";
import { centerScroll, useStore, sleep } from "@/lib/utils";
import { For, Show, createEffect, createSelector, createSignal, onCleanup, onMount, untrack } from "solid-js";
import UserLabel from "./UserLabel";
import UserAvatar from "./UserAvatar";
import SpatialNavigation from "@/lib/spatial_navigation";
import scrollIntoView from "scroll-into-view";
import MarqueeOrNot from "./MarqueeOrNot";
import isEqual from "lodash-es/isEqual";
import { APIUser } from "discord/src/lib/types";

type MessageReaction = DiscordMessage<any>["reactions"]["state"]["value"][number];

function Reaction(props: { $: MessageReaction; selected: boolean; setSelected: (e: MessageReaction) => void }) {
	const emoji = useStore(() => props.$, "emoji");

	const count = useStore(() => props.$, "count");

	return (
		<div
			tabIndex={-1}
			onFocus={(e) => {
				scrollIntoView(e.currentTarget, {
					time: 100,
					ease: (n) => n,
					isScrollable: (target) => {
						return target?.classList?.contains(styles.reaction_container);
					},
				});
			}}
			on:sn-enter-down={() => {
				props.setSelected(props.$);
			}}
			onClick={() => {
				props.setSelected(props.$);
			}}
			classList={{
				focusable: true,
				[styles.reactionButton]: true,
				[styles.selected]: props.selected,
			}}
		>
			<Show when={emoji().id} fallback={<div class={styles.unicode}>{emoji().name}</div>}>
				<div class={styles.non_uni}>
					<img
						src={`https://cdn.discordapp.com/emojis/${emoji().id}.${emoji().animated ? "gif" : "png"}?size=16`}
						alt={emoji().name!}
					/>
				</div>
			</Show>
			<div class={styles.num}>{count()}</div>
		</div>
	);
}

const cache = new WeakMap<MessageReaction, Set<DiscordUser>>();

function ReactionUser(props: { $: DiscordUser; guild: DiscordGuild | null }) {
	const [focused, setFocused] = createSignal(false);

	return (
		<div
			onFocus={(e) => {
				setFocused(true);
				centerScroll(e.currentTarget);
			}}
			onBlur={() => {
				setFocused(false);
			}}
			tabIndex={-1}
			class={"focusable " + styles.user}
		>
			<div class={styles.avatar}>
				<UserAvatar size={20} {...props} />
			</div>
			<div class={styles.name}>
				<MarqueeOrNot marquee={focused()}>
					<UserLabel nickname {...props} /> <span class={styles.username}>{"@" + props.$.$.username}</span>
				</MarqueeOrNot>
			</div>
		</div>
	);
}

function SelectedReaction(props: {
	$: MessageReaction;
	reactions: DiscordMessage<any>["reactions"];
	guild: DiscordGuild | null;
}) {
	const [users, setUsers] = createSignal<Array<DiscordUser>>([]);

	createEffect(() => {
		const selectedReaction = props.$;

		setUsers([]);

		const cached = cache.get(selectedReaction);
		if (cached) {
			setUsers(Array.from(cached));
		}

		const emoji = selectedReaction.$.emoji;

		const hasBurst = Boolean(selectedReaction.$.count_details?.burst);
		if (hasBurst) console.error(selectedReaction.$, selectedReaction.$.count_details?.normal);
		const hasNormal = hasBurst ? Number(selectedReaction.$.count_details?.normal) > 0 : true;

		const resp = hasNormal ? props.reactions.getReactions(emoji, 100).response() : Promise.resolve([]);

		function mergeUsers(users: APIUser[]) {
			const _users = cache.get(selectedReaction) || new Set<DiscordUser>();

			// console.log("Merging users", _users);

			users.forEach((a) => {
				const user = selectedReaction.$message.$channel.$client.addUser(a);
				_users.add(user);
			});

			cache.set(selectedReaction, _users);

			if (props.$ == selectedReaction) {
				setUsers(() => Array.from(_users));
			}
		}

		resp
			.then(async (users) => {
				mergeUsers(users);

				if (hasBurst) {
					await sleep(2000);
					const users = await props.reactions.getReactions(emoji, 100, undefined, 1).response();
					mergeUsers(users);
				}
			})
			.catch((e) => {
				console.error("Error occured when fetching users in reaction emoji", e);
			});
	});

	return (
		<div
			on:sn-navigatefailed={(e) => {
				const direction = e.detail.direction;
				if (direction == "up") {
					SpatialNavigation.focus("reactions");
				}
			}}
			class={styles.reactions}
		>
			<For each={users()} fallback={"Loading..."}>
				{(user) => <ReactionUser $={user} guild={props.guild} />}
			</For>
		</div>
	);
}

export default function MessageReactionsPopup(props: {
	$: DiscordMessage<any>;
	onClose: () => void;
	guild: DiscordGuild | null;
}) {
	const reactions = useStore(() => props.$.reactions.state);
	const [selected, setSelected] = createSignal<MessageReaction | null>(null);

	onMount(() => {
		SpatialNavigation.add("reactions", {
			selector: `.${styles.reaction_container} .focusable`,
			restrict: "self-only",
			rememberSource: true,
		});

		SpatialNavigation.add("reactions_selected", {
			selector: `.${styles.reactions} .focusable`,
			restrict: "self-only",
			rememberSource: true,
		});

		SpatialNavigation.focus("reactions");
	});

	onCleanup(() => {
		SpatialNavigation.remove("reactions");
		SpatialNavigation.remove("reactions_selected");
	});

	createEffect(() => {
		const _r = reactions();
		const _s = selected();

		if (_s == null || (_s && !_r.includes(_s))) {
			setSelected(_r[0]);
		}
	});

	const isSelected = createSelector(selected);

	return (
		<div
			onKeyDown={(e) => {
				if (e.key == "Backspace") {
					props.onClose();
				}
			}}
			class={styles.MessageReactions}
		>
			<div
				on:sn-navigatefailed={(e) => {
					if (e.detail.direction == "down") {
						SpatialNavigation.focus("reactions_selected");
					}
				}}
				class={styles.reaction_container}
			>
				<For each={reactions()}>
					{(reaction) => <Reaction selected={isSelected(reaction)} setSelected={setSelected} $={reaction} />}
				</For>
			</div>

			<Show when={selected()}>
				{($) => <SelectedReaction guild={props.guild} $={$()} reactions={props.$.reactions} />}
			</Show>
		</div>
	);
}
