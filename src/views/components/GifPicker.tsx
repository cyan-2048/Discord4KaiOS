import { centerScroll, pauseKeypress, resumeKeypress } from "@/lib/utils";
import * as styles from "./GifPicker.module.scss";
import { For, Show, batch, createMemo, createSignal, onCleanup, onMount, untrack } from "solid-js";
import SpatialNavigation from "@/lib/spatial_navigation";
import { debounce, memoize } from "lodash-es";
import { discordClientReady } from "@/signals";
import { RateLimitError } from "discord/src/DiscordRequest";

const SN_ID = "gif-picker";

interface GIF {
	id: string;
	title: string;
	url: string;
	src: string;
	gif_src: string;
	width: number;
	height: number;
	preview: string;
}

interface Trending {
	categories: Category[];
	gifs: GIF[];
}

interface Category {
	name: string;
	src: string;
}

function searchGifs(q: string): Promise<GIF[]> {
	return Promise.resolve(
		untrack(discordClientReady)
			?.gif.search(q)
			.response()
			.catch(async (e) => {
				if (e && e instanceof RateLimitError) {
					await e.wait();
					return searchGifs(q);
				}
				return [];
			}) || []
	);
}

const searchGifsMemo = memoize(searchGifs);

function getTrending(): Promise<GIF[]> {
	return Promise.resolve(
		untrack(discordClientReady)
			?.gif.getTrendingGifs()
			.response()
			.catch(async (e) => {
				if (e && e instanceof RateLimitError) {
					await e.wait();
					return getTrending();
				}
				return [];
			}) || []
	);
}

const getTrendingMemo = memoize(getTrending);

let search = (q: string) => {};

function Search(props: { setResult: (result: GIF[]) => void; onClose: () => void }) {
	let inputRef!: HTMLInputElement;

	let mounted = true;

	async function searchGif(search: string) {
		console.log("SEARCHING GIFS!!!");

		const gifs = await searchGifsMemo(search);

		if (!mounted || search != inputRef.value) return;

		if (inputRef?.value) {
			props.setResult(gifs);
		} else {
			props.setResult([]);
		}
	}

	const debouncedSearch = debounce(searchGif, 2100);

	onMount(() => {
		search = (q) => {
			searchGif(q);
			inputRef.value = q;
			inputRef.focus({ preventScroll: true });
		};

		clearSearch = () => {
			inputRef.value = "";
			inputRef.focus({ preventScroll: true });
		};
	});

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
				onFocus={(e) => {
					centerScroll(e.currentTarget);
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
				placeholder="Search GIF"
			/>
		</div>
	);
}

let trendingCache: Trending | null = null;
let clearSearch = () => {};

function GifCategory(props: { onClose: () => void; category: Category }) {
	const [focused, setFocused] = createSignal(false);

	return (
		<div
			tabIndex={-1}
			classList={{ [styles.category]: true, focusable: true }}
			style={{
				"background-image": `url(${
					focused() ? props.category.src : props.category.src.replace("AAAAM/", "AAAAD/")
				})`,
			}}
			onFocus={(e) => {
				centerScroll(e.currentTarget);
				setFocused(true);
			}}
			onBlur={() => setFocused(false)}
			on:sn-enter-down={() => {
				search(props.category.name);
			}}
			onKeyDown={(e) => {
				if (e.key == "Backspace") {
					props.onClose();
				}
			}}
		>
			<div>{props.category.name}</div>
		</div>
	);
}

function Trending(props: { onClose: () => void; showTrending: () => void }) {
	const [trending, setTrending] = createSignal<Category[]>([]);

	let mounted = true;

	const [trendingGif, setTrendingGif] = createSignal<GIF[]>([]);
	const [focused, setFocused] = createSignal(false);

	onMount(() => {
		const client = discordClientReady();
		if (trendingCache) {
			batch(() => {
				setTrendingGif(trendingCache!.gifs);
				setTrending(trendingCache!.categories);
			});
		} else if (client) {
			async function fetchTrending() {
				client &&
					client.gif
						.getTrending()
						.response()
						.then((trending) => {
							if (mounted) {
								trendingCache = trending;
								batch(() => {
									setTrendingGif(trending.gifs);
									setTrending(trending.categories);
								});
							}
						})
						.catch(async (e) => {
							if (e && e instanceof RateLimitError) {
								await e.wait();
								fetchTrending();
							}
						});
			}

			fetchTrending();
		}
	});

	onCleanup(() => {
		mounted = false;
	});

	return (
		<div class={styles.trending}>
			<div
				tabIndex={-1}
				classList={{ [styles.category]: true, focusable: true }}
				style={{
					"background-image": trendingGif()[0]
						? `url(${focused() ? trendingGif()[0].src : trendingGif()[0].preview})`
						: undefined,
				}}
				onFocus={(e) => {
					centerScroll(e.currentTarget);
					setFocused(true);
				}}
				onBlur={(e) => {
					setFocused(false);
				}}
				on:sn-enter-down={() => {
					props.showTrending();
				}}
				onKeyDown={(e) => {
					if (e.key == "Backspace") {
						props.onClose();
					}
				}}
			>
				<div>trending</div>
			</div>

			<For each={trending()}>{(category) => <GifCategory onClose={props.onClose} category={category} />}</For>
		</div>
	);
}

function inColumns<T>(arr: T[], count: number) {
	return Array.from(Array(3).keys(), (c) => arr.filter((_, i) => i % count === c));
}

function GifItem(props: { gif: GIF; onKeyDown: (e: KeyboardEvent) => void }) {
	const [focused, setFocused] = createSignal(false);

	return (
		<div
			tabIndex={-1}
			onFocus={(e) => {
				setFocused(true);
				centerScroll(e.currentTarget);
			}}
			onBlur={() => setFocused(false)}
			style={{
				height: Math.floor((props.gif.height / props.gif.width) * 110) + "px",
				"background-image": `url(${focused() ? props.gif.src : props.gif.preview.replace(/\.png$/, "")})`,
			}}
			onKeyDown={props.onKeyDown}
			classList={{ [styles.gif]: true, focusable: true }}
		></div>
	);
}

export default function GifPicker(props: { onSelect: (url: string) => void; onClose: () => void }) {
	const [result, setResult] = createSignal<GIF[]>([]);

	const columns = createMemo(() => inColumns(result(), 2));

	onMount(() => {
		pauseKeypress();
		SpatialNavigation.add(SN_ID, {
			selector: `.${styles.picker} .${styles.search} input, .${styles.picker} .focusable`,
			restrict: "self-only",
		});

		SpatialNavigation.focus(SN_ID);
	});

	let isShowingTrending = false;

	onCleanup(() => {
		SpatialNavigation.remove(SN_ID);
		resumeKeypress();
	});

	return (
		<div class={styles.picker}>
			<div class={styles.main}>
				<Search
					onClose={props.onClose}
					setResult={(e) => {
						isShowingTrending = false;
						setResult(e);
					}}
				/>

				<Show
					when={result().length}
					fallback={
						<Trending
							showTrending={() => {
								if (isShowingTrending) return;
								isShowingTrending = true;
								clearSearch();
								getTrendingMemo().then(setResult);
							}}
							onClose={props.onClose}
						/>
					}
				>
					<div class={styles.content}>
						<For each={columns()}>
							{(column) => (
								<Show when={column.length}>
									<div class={styles.column}>
										<For each={column}>
											{(gif) => (
												<GifItem
													gif={gif}
													onKeyDown={(e) => {
														if (e.key == "Enter") {
															props.onSelect(gif.url);
														}
														if (e.key == "Backspace") {
															if (isShowingTrending) {
																isShowingTrending = false;
																setResult([]);
																clearSearch();
															} else {
																props.onClose();
															}
														}
													}}
												></GifItem>
											)}
										</For>
									</div>
								</Show>
							)}
						</For>
					</div>
				</Show>
			</div>
		</div>
	);
}
