import debounce from "lodash-es/debounce";
import * as styles from "./EmojiPicker.module.scss";
import { centerScroll, pauseKeypress, resumeKeypress, sleep } from "@/lib/utils";
import { fuzzySearch, type Emoji } from "@workers";
import { For, Show, batch, createSignal, onCleanup, onMount, untrack } from "solid-js";
import SpatialNavigation from "@/lib/spatial_navigation";
import { discordClientReady, emojiVariation, useStoredSignal } from "@/signals";
import { DiscordGuild } from "discord";
import { APIEmoji } from "discord/src/lib/types";
import { memoize } from "lodash-es";

export const enum SkinVariation {
	Light = "1F3FB",
	MediumLight = "1F3FC",
	Medium = "1F3FD",
	MediumDark = "1F3FE",
	Dark = "1F3FF",
}

export const SUPPORTED_VARIATIONS = [
	SkinVariation.Light,
	SkinVariation.MediumLight,
	SkinVariation.Medium,
	SkinVariation.MediumDark,
	SkinVariation.Dark,
] as const;

export function fromCodePoint(codepoint: string | number) {
	var code = typeof codepoint === "string" ? parseInt(codepoint, 16) : codepoint;
	if (code < 0x10000) {
		return String.fromCharCode(code);
	}
	code -= 0x10000;
	return String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
}

const toCodePoint = memoize(function toCodePoint(unicodeSurrogates: string, sep?: any) {
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
});

function Search(props: { setResult: (result: Emoji[]) => void; onClose: () => void }) {
	let inputRef!: HTMLInputElement;

	let mounted = true;

	const debouncedSearch = debounce(async (search: string) => {
		console.log("SEARCHING EMOJIS!!!");

		const results = await fuzzySearch(search);

		if (!mounted) return;

		if (inputRef?.value) {
			props.setResult(results);
		} else {
			props.setResult([]);
		}
	}, 500);

	onCleanup(() => {
		mounted = false;
	});

	return (
		<div class={styles.search}>
			<input
				ref={inputRef}
				onInput={(e) => {
					const search = e.target.value;
					if (search) {
						debouncedSearch(search);
					} else {
						props.setResult([]);
					}
				}}
				onFocus={() => {
					setFocusedEmoji(null);
				}}
				onKeyDown={(e) => {
					if (e.key == "Backspace" && !(e.target as HTMLInputElement).value) {
						props.onClose();
					}
					if (e.key.includes("Arrow") && (e.key.includes("Right") || e.key.includes("Left"))) {
						e.stopPropagation();
						e.stopImmediatePropagation();
					}
				}}
				type="search"
				placeholder="Search emojis"
			/>
		</div>
	);
}

const [focusedEmoji, setFocusedEmoji] = createSignal<Emoji | ServerEmoji | null>(null);

const JDECKED = "https://jdecked.github.io/twemoji/v/latest/svg/";

function EmojiItem(props: {
	emoji: Emoji;
	onSelect: (emoji: Emoji, withVariation?: string) => void;
	onClose: () => void;
}) {
	const [, setFrequentEmojis] = useStoredSignal(
		[] as Array<{
			count: number;
			emoji: Emoji;
		}>,
		"frequentEmojis"
	);

	const [, setFavoriteEmojis] = useStoredSignal([] as Emoji[], "favoriteEmojis");

	let divRef!: HTMLDivElement;

	onCleanup(() => {
		if (divRef == document.activeElement) {
			SpatialNavigation.move("right") ||
				SpatialNavigation.move("up") ||
				SpatialNavigation.move("left") ||
				SpatialNavigation.move("down");
		}
	});

	const emojiWithVariation = () => {
		const emoji = props.emoji;
		const variation = emojiVariation();
		const withVariation = variation ? emoji.variation?.[variation] : undefined;

		return withVariation || emoji.$;
	};

	return (
		<div
			ref={divRef}
			class={styles.emoji}
			on:sn-enter-down={() => {
				setFrequentEmojis((emojis) => {
					const found = emojis.find((e) => e.emoji.$ == props.emoji.$);

					if (found) {
						found.count++;
						return emojis.toSorted((a, b) => b.count - a.count);
					}

					return emojis.concat({ count: 1, emoji: props.emoji }).toSorted((a, b) => b.count - a.count);
				});

				props.onSelect(props.emoji, untrack(emojiWithVariation) || props.emoji.$);
			}}
			on:sn-navigatefailed={(e) => {
				const actEl = e.currentTarget;
				const direction = e.detail.direction;

				if (direction == "left") {
					const prev = actEl.previousElementSibling as HTMLElement;
					prev?.focus();
				} else if (direction == "right") {
					const next = actEl.nextElementSibling as HTMLElement;
					next?.focus();
				}
			}}
			onKeyDown={(e) => {
				if (e.key == "Backspace") {
					props.onClose();
				} else if (e.key == "*") {
					sleep(100).then(() =>
						setFavoriteEmojis((emojis) => {
							const found = emojis.find((e) => e.$ == props.emoji.$);

							if (found) {
								return emojis.filter((e) => e.$ != props.emoji.$);
							}

							return [props.emoji].concat(emojis);
						})
					);
				}
			}}
			tabIndex={-1}
			onFocus={(e) => {
				centerScroll(e.target as HTMLElement);
				setFocusedEmoji(props.emoji);
			}}
		>
			<img
				width={25}
				height={25}
				src={JDECKED + toCodePoint(emojiWithVariation()) + ".svg"}
				alt={props.emoji.$}
			/>
		</div>
	);
}

function FrequentEmojis(props: { onSelect: (emoji: Emoji) => void; onClose: () => void }) {
	const [frequentEmojis] = useStoredSignal(
		[] as Array<{
			count: number;
			emoji: Emoji;
		}>,
		"frequentEmojis"
	);

	const frequent = () => frequentEmojis().slice(0, 45);

	return (
		<Show when={frequent().length}>
			<div class={styles.category}>
				<div class={styles.icon}>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
						<path
							fill="currentColor"
							fill-rule="evenodd"
							d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm1-18a1 1 0 1 0-2 0v7c0 .27.1.52.3.7l3 3a1 1 0 0 0 1.4-1.4L13 11.58V5Z"
							clip-rule="evenodd"
							class=""
						></path>
					</svg>
				</div>
				frequently used
			</div>
			<div class={styles.content}>
				<For each={frequent()}>{(frequent) => <EmojiItem emoji={frequent.emoji} {...props} />}</For>
			</div>
		</Show>
	);
}

function FavoriteEmojis(props: { onSelect: (emoji: Emoji) => void; onClose: () => void }) {
	const [favoriteEmojis] = useStoredSignal([] as Emoji[], "favoriteEmojis");

	return (
		<Show when={favoriteEmojis().length}>
			<div class={styles.category}>
				<div class={styles.icon}>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
						<path
							fill="currentColor"
							d="M10.81 2.86c.38-1.15 2-1.15 2.38 0l1.89 5.83h6.12c1.2 0 1.71 1.54.73 2.25l-4.95 3.6 1.9 5.82a1.25 1.25 0 0 1-1.93 1.4L12 18.16l-4.95 3.6c-.98.7-2.3-.25-1.92-1.4l1.89-5.82-4.95-3.6a1.25 1.25 0 0 1 .73-2.25h6.12l1.9-5.83Z"
							class=""
						></path>
					</svg>
				</div>
				favorites
			</div>
			<div class={styles.content}>
				<For each={favoriteEmojis()}>{(emoji) => <EmojiItem emoji={emoji} {...props} />}</For>
			</div>
		</Show>
	);
}

function FocusedEmojiDescription() {
	const [favoriteEmojis] = useStoredSignal([] as Emoji[], "favoriteEmojis");

	const emojiWithVariation = () => {
		const emoji = focusedEmoji() as Emoji;
		const variation = emojiVariation();
		const withVariation = variation ? emoji.variation?.[variation] : undefined;

		return withVariation || emoji.$;
	};

	return (
		<Show when={focusedEmoji()}>
			<div class={styles.focused}>
				<Show
					when={"guild" in focusedEmoji()! && (focusedEmoji() as ServerEmoji)}
					fallback={
						<img
							width={25}
							height={25}
							src={JDECKED + toCodePoint(emojiWithVariation()) + ".svg"}
							alt={focusedEmoji()!.$}
						/>
					}
				>
					{(emoji) => (
						<img
							width={25}
							height={25}
							style={{ "border-radius": "2px" }}
							src={`https://cdn.discordapp.com/emojis/${emoji().$}.${emoji().animated ? "gif" : "png"}?size=32`}
							alt={emoji().name}
						/>
					)}
				</Show>

				<Show when={favoriteEmojis().find((a) => a.$ == focusedEmoji()?.$)}>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24">
						<path
							fill="currentColor"
							d="M10.81 2.86c.38-1.15 2-1.15 2.38 0l1.89 5.83h6.12c1.2 0 1.71 1.54.73 2.25l-4.95 3.6 1.9 5.82a1.25 1.25 0 0 1-1.93 1.4L12 18.16l-4.95 3.6c-.98.7-2.3-.25-1.92-1.4l1.89-5.82-4.95-3.6a1.25 1.25 0 0 1 .73-2.25h6.12l1.9-5.83Z"
							class=""
						></path>
					</svg>
				</Show>
				<div class={styles.desc}>
					<Show
						when={"guild" in focusedEmoji()!}
						fallback={
							<For each={Array.from((focusedEmoji() as Emoji)!.short_names || [])}>
								{(shortname) => <span class={styles.text}>:{shortname}:</span>}
							</For>
						}
					>
						<span class={styles.text}>:{focusedEmoji()!.name}:</span>
					</Show>
				</div>
			</div>
		</Show>
	);
}

const SN_ID = "emoji-picker";

interface ServerEmoji {
	guild: string;
	/**
	 * snowflake of the emoji
	 */
	$: string;
	name: string;
	animated: boolean;
}

function ServerEmojiItem(props: {
	onSelect: (emoji: ServerEmoji) => void;
	onClose: () => void;
	guild: DiscordGuild;
	emoji: APIEmoji;
}) {
	const emoji: ServerEmoji = {
		$: props.emoji.id!,
		name: props.emoji.name!,
		animated: props.emoji.animated || false,
		guild: props.guild.id,
	};

	const [focused, setFocused] = createSignal(false);

	return (
		<div
			class={styles.emoji}
			on:sn-enter-down={() => {
				props.onSelect(emoji);
			}}
			on:sn-navigatefailed={(e) => {
				const actEl = e.currentTarget;
				const direction = e.detail.direction;

				if (direction == "left") {
					const prev = actEl.previousElementSibling as HTMLElement;
					prev?.focus();
				} else if (direction == "right") {
					const next = actEl.nextElementSibling as HTMLElement;
					next?.focus();
				}
			}}
			onKeyDown={(e) => {
				if (e.key == "Backspace") {
					props.onClose();
				}
			}}
			tabIndex={-1}
			onFocus={(e) => {
				centerScroll(e.currentTarget);
				batch(() => {
					setFocusedEmoji(emoji);
					setFocused(true);
				});
			}}
			onBlur={() => {
				setFocused(false);
			}}
		>
			<img
				style={{
					"object-fit": "contain",
				}}
				width={25}
				height={25}
				src={`https://cdn.discordapp.com/emojis/${props.emoji.id}.${
					focused() && props.emoji.animated ? "gif" : "png"
				}?size=32`}
			/>
		</div>
	);
}

function ServerEmojis(props: {
	guild: DiscordGuild;
	onSelect: (emoji: ServerEmoji) => void;
	onClose: () => void;
}) {
	const isNitroUser = Number(untrack(discordClientReady)?.ready.user.premium_type) > 0;

	return (
		<>
			<div class={styles.category}>
				<div class={styles.icon}>
					<Show
						when={props.guild.value.icon}
						fallback={
							<div>
								{props.guild.value.name
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
								style={{ "border-radius": "4px" }}
								height={16}
								width={16}
								src={`https://cdn.discordapp.com/icons/${props.guild.id}/${icon()}.png?size=32`}
							/>
						)}
					</Show>
				</div>
				{props.guild.value.name}
			</div>
			<div class={styles.content}>
				<For each={props.guild.$.emojis}>
					{(serverEmoji) => (
						<Show when={serverEmoji.available !== false && (serverEmoji.animated ? isNitroUser : true)}>
							<ServerEmojiItem {...props} emoji={serverEmoji} />
						</Show>
					)}
				</For>
			</div>
		</>
	);
}

export default function EmojiPicker(props: {
	onSelect: (emoji: Emoji | ServerEmoji, withVariation?: string) => void;
	onClose: () => void;
	guild: DiscordGuild | null;
}) {
	const [result, setResult] = createSignal<Emoji[]>([]);

	onMount(() => {
		pauseKeypress();
		SpatialNavigation.add(SN_ID, {
			selector: `.${styles.picker} .${styles.search} input, .${styles.picker} .${styles.emoji}`,
			restrict: "self-only",
		});

		SpatialNavigation.focus(SN_ID);
	});

	onCleanup(() => {
		SpatialNavigation.remove(SN_ID);
		resumeKeypress();
	});

	return (
		<div class={styles.picker}>
			<div class={styles.main}>
				<Search onClose={props.onClose} setResult={setResult} />

				<Show
					when={result().length}
					fallback={
						<>
							<FavoriteEmojis {...props} />
							<FrequentEmojis {...props} />
							<Show when={props.guild}>
								{(guild) => <ServerEmojis guild={guild()} onClose={props.onClose} onSelect={props.onSelect} />}
							</Show>
						</>
					}
				>
					<div class={styles.content}>
						<For each={result()}>{(emoji) => <EmojiItem emoji={emoji} {...props} />}</For>
					</div>
				</Show>
			</div>
			<FocusedEmojiDescription />
		</div>
	);
}
