import { DiscordMessage } from "discord";
import { APIAttachment, APIEmbed, APIEmbedImage, APIEmbedThumbnail } from "discord/src/lib/types";
import * as styles from "./MessageEmbeds.module.scss";
import debounce from "lodash-es/debounce";
import {
	centerScroll,
	isInViewport,
	isPartiallyInViewport,
	niceBytes,
	pauseKeypress,
	resumeKeypress,
	sleep,
	useKeypress,
	useStore,
} from "@/lib/utils";
import Markdown, { Renderer } from "./Markdown";
import { rgbaToDataURL, thumbHashToRGBA } from "thumbhash";
import { ezgifAllowed, thumbhashPreview } from "../../signals";

import webp2png from "@/lib/ezgif-webp2png";
import {
	ComponentProps,
	For,
	JSXElement,
	Match,
	Show,
	Switch,
	createEffect,
	createSignal,
	createUniqueId,
	onCleanup,
	onMount,
	splitProps,
	untrack,
} from "solid-js";
import SpatialNavigation from "@/lib/spatial_navigation";
import { fullscreen } from "../modals/fullscreen";
import ImageViewer from "./ImageViewer";
import VideoViewer from "./VideoViewer";
import { LRUCache } from "lru-cache";
import { rlottie, webp } from "@/workers";

interface ClientAPIEmbedThumbnail extends APIEmbedThumbnail {
	placeholder: string;
	placeholder_version: number;
}

type APIEmbedWithThumbnail = APIEmbed & { thumbnail: APIEmbedThumbnail };

let webp2pngQueue = Promise.resolve() as Promise<any>;
const webp2pngCache = new Map<string, string | null>();

// function webp2png(url: string) {
// 	return new Promise<string | null>((resolve, reject) => {
// 		const xhr = new XMLHttpRequest();
//
// 		// imma use a webworker because kaios is shit
// 		xhr.open("GET", "https://webp2png.cyan-2048.workers.dev/?url=" + encodeURIComponent(url));
//
// 		xhr.onload = function () {
// 			if (this.status === 200) {
// 				const src = this.responseText;
// 				resolve(src);
// 			} else {
// 				resolve(null);
// 			}
// 		};
//
// 		xhr.onerror = () => resolve(null);
//
// 		xhr.send();
// 	});
// }

async function cachedWebp2png(url: string) {
	if (webp2pngCache.has(url)) return Promise.resolve(webp2pngCache.get(url)!);
	await webp2pngQueue;

	// add a timeout just in case
	await sleep(10);
	// in case it was added while we were waiting
	if (webp2pngCache.has(url)) return Promise.resolve(webp2pngCache.get(url)!);

	const promise = webp2png(url).catch(() => null);
	webp2pngQueue = promise;

	const result = await promise;
	console.log("RESSSULLTTTT", result);

	webp2pngCache.set(url, result);
	return result;
}

const cachedImagesJar = new Map<string, string>();
const libwebpCache = new Map<string, string>();

const ImageThumbhash = function (
	props: Omit<ComponentProps<"img">, "ref" | "onClick" | "style"> & {
		$?: APIEmbedThumbnail | APIAttachment | APIEmbedImage;
		ref?: (e: HTMLImageElement) => void;
		onClick?: () => void;
		style?: {
			[x: string]: string | undefined;
		};
		blobSrc?: (url: string) => void;
	}
) {
	const [placeholderSrc, setPlaceholder] = createSignal("");
	const [hide, setHide] = createSignal(false);

	const [focused, setFocused] = createSignal(false);

	let imageEl!: HTMLImageElement;
	let canvasEl!: HTMLCanvasElement;

	const [, _props] = splitProps(props, [
		"$",
		"onError",
		"src",
		"tabIndex",
		"onFocus",
		"onBlur",
		"ref",
		"style",
	]);

	const thumbnail = () => props.$ as ClientAPIEmbedThumbnail;

	const [width, setWidth] = createSignal(0);
	const [height, setHeight] = createSignal(0);

	onMount(() => {
		const img = imageEl;
		if (!img) return;
		props.ref?.(img);
		setWidth(img.clientWidth);
		setHeight(img.clientHeight);
	});

	const [src, setSrc] = createSignal("");
	const [blob, setBlob] = createSignal<null | Blob>(null);

	createEffect(() => {
		if (!props.src) return;
		imageEl?.setAttribute("data-src", props.src);

		if (cachedImagesJar.has(props.src)) {
			const src = cachedImagesJar.get(props.src)!;
			setSrc(src);
			props.blobSrc?.(src);
			return;
		}

		// const img = new Image();
		// img.src = props.src;

		// @ts-ignore
		const xhr = new XMLHttpRequest({ mozSystem: true, mozAnon: true });
		xhr.open("GET", props.src);

		xhr.setRequestHeader("Accept", "image/avif,image/webp,*/*");

		xhr.responseType = "blob";

		let done = false;

		xhr.onload = () => {
			const blob = xhr.response;
			const url = URL.createObjectURL(blob);
			cachedImagesJar.set(props.src!, url);
			setBlob(blob);
			setSrc(url);
			props.blobSrc?.(url);
			done = true;
		};

		xhr.onerror = (e) => {
			// @ts-ignore
			props.onError?.(e as any);
		};

		xhr.send();

		onCleanup(() => {
			if (done) return;
			xhr.onerror = null;
			xhr.onload = null;

			xhr.abort();
		});
	});

	createEffect(() => {
		setHide(false);

		if (!(thumbnail() && "placeholder" in thumbnail()) || !untrack(thumbhashPreview)) return;

		const buffer = Uint8Array.from(atob(thumbnail().placeholder), (e) => e.charCodeAt(0));

		const _ = thumbHashToRGBA(buffer);
		const dataurl = rgbaToDataURL(_.w, _.h, _.rgba);
		setPlaceholder(dataurl);

		let timeout: Timer;

		if (imageEl) {
			const el = imageEl;

			function onLoad() {
				setHide(true);
				timeout = setTimeout(() => {
					setPlaceholder("");
				}, 200);
				setWidth(el.clientWidth);
				setHeight(el.clientHeight);
			}

			el.addEventListener("load", onLoad);
			return () => {
				el.removeEventListener("load", onLoad);
				clearTimeout(timeout);
			};
		}
	});

	let triedReplaceWebp = false;
	let triedEzgif = false;
	let tryingEzgif = false;
	let triedLibWebp = false;
	let tryingLibWebp = false;

	async function onError(e: ErrorEvent) {
		if (!untrack(src)) return;
		console.error("ERROR OCCURED WHEN RENDERING THIS IMAGE", e);
		await sleep(1000); // weird
		if (imageEl.naturalWidth != 0 && imageEl.naturalHeight != 0) {
			console.warn("IMAGE SEEMED TO HAVE LOADED", imageEl);
			return;
		}

		if (tryingEzgif) {
			console.warn("currently trying ezgif, image onError skipped");
			return;
		}

		if (tryingLibWebp) {
			console.warn("currently trying libwebp, image onError skipped");
			return;
		}

		try {
			const originalSrc = props.src;
			if (!originalSrc || !props.$) throw originalSrc;

			if (props.$.url.includes(".webp") || props.$.proxy_url?.includes(".webp")) {
				if (triedReplaceWebp) {
					if (!triedLibWebp && props.$ && props.$.height && props.$.width) {
						console.log("TRY: use libwebp");
						const cached = libwebpCache.get(originalSrc);

						if (cached) {
							props.blobSrc?.(cached);
							setSrc(cached);
							return;
						}

						triedLibWebp = true;
						tryingLibWebp = true;

						const result = await webp(
							new Uint8Array(await blob()!.arrayBuffer()),
							props.$.width,
							props.$.height
						).catch(() => null);

						if (result) {
							canvasEl.width = result.width;
							canvasEl.height = result.height;

							const imageData = new ImageData(new Uint8ClampedArray(result.rgba), result.width, result.height);

							canvasEl.getContext("2d")!.putImageData(imageData, 0, 0);

							const blobResult = await new Promise<Blob>((res) =>
								canvasEl.toBlob(
									async (blob) => {
										if (blob) {
											res(blob);
										}
									},
									"image/png",
									0.75
								)
							);

							console.log("SUCCESS: USE LIBWEBP", result);

							const pngSrc = URL.createObjectURL(blobResult);
							libwebpCache.set(originalSrc, pngSrc);
							props.blobSrc?.(pngSrc);
							setSrc(pngSrc);
						} else {
							console.error("FAILED: TO USE LIBWEBP");
							// @ts-ignore
							props.onError();
						}

						return;
					}

					// if ezgif has not been tried
					if (!triedEzgif && untrack(ezgifAllowed)) {
						console.log("TRY: USE EZGIF WEBP2PNG");
						triedEzgif = true;
						tryingEzgif = true;
						const pngSrc = await cachedWebp2png(originalSrc);
						tryingEzgif = false;
						if (pngSrc) {
							console.log("SUCCESS: USE EZGIF WEBP2PNG", pngSrc);
							props.blobSrc?.(pngSrc);
							setSrc(pngSrc);
						} else {
							console.error("FAILED: TO USE EZGIF WEBP2PNG");
							// @ts-ignore
							props.onError();
						}

						return;
					}
				} else {
					console.log("TRY: REPLACE WEBP WITH PNG");
					triedReplaceWebp = true;
					if (props.$.url.includes("cdn.discordapp.com")) {
						setSrc(props.$.url.replace(".webp", ".png"));
					} else {
						setSrc(originalSrc.replace(".webp", ".png"));
					}
					return;
				}
			}
		} catch {}

		console.warn("onError is called");
		// if all else fails, just show file attachment
		//@ts-ignore
		props.onError?.(...arguments);
	}

	onMount(() => {
		const img = imageEl;
		if (!img) return;
		if (img.complete && img.naturalWidth !== 0) {
			setHide(true);
		}
	});

	function onFocus(e: FocusEvent & { currentTarget: HTMLImageElement }) {
		setFocused(true);
		centerScroll(e.currentTarget);
	}

	function onBlur() {
		setFocused(false);
	}

	function onEnterDown() {
		console.log("ENTER DOWNNNN");

		if (props.onClick) {
			props.onClick();
			return;
		}

		if (!props.$ || !props.$.proxy_url) return;
		const $ = props.$;
		setPaused(true);
		const close = fullscreen(() => (
			<ImageViewer
				src={untrack(src)}
				filename={"filename" in $ ? $.filename : undefined}
				originalSrc={$.url}
				onClose={async () => {
					await close?.();
					setPaused(false);
					makeContentUnfocusable();
				}}
			/>
		));
	}

	return (
		<>
			<Show
				when={thumbnail() && "placeholder" in thumbnail()}
				fallback={
					<img
						{..._props}
						style={{
							outline: focused() ? "2px solid #5865f2" : "none",
							opacity: src() === "" ? 0 : undefined,
							...props.style,
						}}
						tabIndex={-1}
						on:sn-enter-down={onEnterDown}
						src={src()}
						onError={onError as any}
						onFocus={onFocus}
						onBlur={onBlur}
						ref={imageEl}
					/>
				}
			>
				<div
					class={styles.thumbhash}
					style={{
						width: width() + "px",
						height: height() + "px",
					}}
				>
					<img
						{..._props}
						src={src()}
						ref={imageEl}
						style={{
							outline: focused() ? "2px solid #5865f2" : "none",
							opacity: src() === "" ? 0 : undefined,
						}}
						on:sn-enter-down={onEnterDown}
						onError={onError as any}
						onFocus={onFocus}
						onBlur={onBlur}
						tabIndex={-1}
					/>
					<Show when={placeholderSrc()}>
						<img
							{..._props}
							classList={{ [styles.layer]: true, [styles.hide]: hide() }}
							src={placeholderSrc()}
						/>
					</Show>
				</div>
			</Show>
			<canvas
				style={{
					display: "none",
				}}
				ref={canvasEl}
			></canvas>
		</>
	);
};

const decideHeight = (
	e: { width?: number | null; height?: number | null },
	size = 203,
	minus?: number
): {
	height?: number;
	width?: number;
	"data-height"?: number;
	"data-width"?: number;
} => {
	if (!e || typeof e !== "object") return {};
	const dataset = { "data-height": e.height ?? undefined, "data-width": e.width ?? undefined };
	let { height, width } = e;
	if (!height || !width) return {};
	if (minus && height - minus > 0 && width - minus > 0) {
		height -= minus;
		width -= minus;
	}
	if ((width || 0) > size) {
		return {
			width: size,
			height: Math.floor((height / width) * size),
			...dataset,
		};
	} else return { height, width, ...dataset };
};

function GifVEmbed(props: { $: APIEmbedWithThumbnail }) {
	const [src, setSrc] = createSignal(props.$.thumbnail.proxy_url!);
	let imgEl: HTMLImageElement | undefined;

	const checkIfInView = function () {
		if (imgEl && isPartiallyInViewport(imgEl)) {
			console.log("SET TO GIF");
			// hope this doesn't change much
			// because of democracy, we need to use actual tenor gifs instead of discord's proxy
			// very viewlogger yikes
			setSrc(props.$.url! + ".gif");
		} else {
			// if not in viewport, use the thumbnail
			setSrc(props.$.thumbnail.proxy_url!);
		}
	};

	onMount(() => {
		checkIfInView();
		document.addEventListener("scroll", checkIfInView, true);
	});

	onCleanup(() => {
		document.removeEventListener("scroll", checkIfInView, true);
	});

	return (
		<ImageThumbhash
			class="v-image"
			$={props.$.thumbnail}
			{...decideHeight(props.$.thumbnail)}
			ref={(e) => {
				imgEl = e;
			}}
			src={src()}
		/>
	);
}

const fps = 60; // target frames per second
const frameDuration = 1000 / fps;

type CachedSticker = Array<Uint8ClampedArray> &
	Partial<{
		frames: number;
	}>;

const lruSticker = new LRUCache<string, CachedSticker>({
	max: 5,
	dispose(value) {
		value.length = 0;
	},
});

function LottieSticker(props: { src: string }) {
	let ref!: HTMLDivElement;

	let paused = true;

	const checkIfInView = function () {
		if (ref && isPartiallyInViewport(ref)) {
			paused = false;
		} else {
			paused = true;
		}
	};

	let mounted = true;

	let frames = 0;
	let currentFrame = 0;

	const [lottieData, setLottieData] = createSignal("");
	const [rLottieReady, setRlottieReady] = createSignal(false);
	const [rlottieCanvasRef, setRlottieCanvasRef] = createSignal<null | HTMLCanvasElement>(null);

	onMount(() => {
		document.addEventListener("scroll", checkIfInView, true);
	});

	onCleanup(() => {
		mounted = false;
		document.removeEventListener("scroll", checkIfInView, true);
	});

	createEffect(() => {
		const ready = rLottieReady();
		// const isFocused = focused();
		const canvas = rlottieCanvasRef();
		const id = props.src;

		if (!ready) return;
		// if (!isFocused) return;
		if (!canvas) return;

		const context = canvas.getContext("2d")!;

		let destroyed = false;
		let animFrame: number;

		let startTime: number;

		const cachedFrames: CachedSticker = lruSticker.get(id) || [];
		cachedFrames.frames = frames;
		lruSticker.set(id, cachedFrames);

		async function tick_cb(timestamp: number) {
			if (destroyed) return;

			if (paused) {
				requestAnimationFrame((e) => tick_cb(e));
				return;
			}

			if (!startTime) startTime = timestamp;

			const elapsed = timestamp - startTime;
			const frameIndex = Math.floor(elapsed / frameDuration);

			if (frameIndex !== currentFrame) {
				currentFrame = frameIndex % frames; // Loop back to the beginning if needed

				if (currentFrame >= frames) currentFrame = 0;

				const clampedBuffer =
					cachedFrames[currentFrame] || (await rlottie.requestFrame(id, currentFrame, 160, 160));
				cachedFrames[currentFrame] = clampedBuffer;

				// console.timeEnd("TEST");
				const imageData = new ImageData(clampedBuffer, 160, 160);
				context.putImageData(imageData, 0, 0);
			}

			animFrame = requestAnimationFrame((e) => {
				tick_cb(e);
			});
		}

		animFrame = requestAnimationFrame((e) => {
			tick_cb(e);
		});

		onCleanup(() => {
			destroyed = true;
			// console.log("destroyer");
			cancelAnimationFrame(animFrame);
			currentFrame = 0;
		});
	});

	createEffect(async () => {
		const canvas = rlottieCanvasRef();
		const data = lottieData();

		if (!canvas) return;
		if (!data) return;

		await rlottie.loadRlottie();

		const cached = await rlottie.isCached(props.src);

		if (cached === false) {
			frames = await rlottie.loadAnimation(props.src, data);
		} else {
			frames = cached;
		}

		setRlottieReady(true);
	});

	// @ts-ignore
	const xhr = new XMLHttpRequest({ mozSystem: true });

	onMount(async () => {
		xhr.open("GET", props.src, true);

		xhr.onload = () => {
			const data = xhr.responseText;

			setLottieData(data);

			checkIfInView();
		};

		xhr.send();
	});

	onCleanup(() => {
		xhr.abort();
	});

	return (
		<div
			ref={ref}
			style={{
				width: "160px",
				height: "160px",
			}}
			data-sticker
		>
			<canvas ref={setRlottieCanvasRef} height={160} width={160}></canvas>
		</div>
	);
}

function Sticker(props: Record<"name" | "id", string>) {
	let ref!: HTMLImageElement;

	const [partiallyInViewport, setPartiallyInViewport] = createSignal(false);

	const checkIfInView = function () {
		if (ref && isPartiallyInViewport(ref)) {
			setPartiallyInViewport(true);
		} else {
			setPartiallyInViewport(false);
		}
	};

	onMount(() => {
		document.addEventListener("scroll", checkIfInView, true);
	});

	onCleanup(() => {
		document.removeEventListener("scroll", checkIfInView, true);
	});

	return (
		<img
			style={{
				"object-fit": "contain",
			}}
			ref={ref}
			data-sticker
			src={`https://media.discordapp.net/stickers/${props.id}.png?size=160${
				partiallyInViewport() ? "" : "&passthrough=false"
			}`}
			width="160"
			height="160"
			alt={`Sticker: ${props.name}`}
		/>
	);
}

export function FocusableLink(
	props: ComponentProps<"a"> & {
		react?: JSXElement;
		onNavigate?: () => void;
	}
) {
	const [, _props] = splitProps(props, ["react", "onNavigate"]);

	const [focused, setFocused] = createSignal(false);

	let ref!: HTMLDivElement;

	return (
		<div
			ref={ref}
			class="focusable-attachment"
			style={{
				display: "inline",
				outline: focused() ? "2px solid #5865f2" : "none",
			}}
			on:sn-enter-down={() => {
				props.onNavigate?.();
				makeContentUnfocusable();
			}}
			onFocus={() => {
				setFocused(true);
				ref && centerScroll(ref);
			}}
			onBlur={() => setFocused(false)}
			tabIndex={-1}
		>
			<Show when={!props.react}>
				<a {..._props} />
			</Show>
			<Show when={props.react}>{props.react}</Show>
		</div>
	);
}

function ImageEmbed(props: { $: APIEmbedWithThumbnail }) {
	const embed = props.$;
	const src = embed.thumbnail.proxy_url;

	return (
		<ImageThumbhash
			data-url={embed.url}
			class="v-image"
			src={src}
			$={embed.thumbnail}
			{...decideHeight(embed.thumbnail)}
			// on:click={() => {
			// 	const { url: download } = embed;
			// 	showImage({ src, download });
			// }}
		/>
	);
}

function MessageEmbed(props: { $: APIEmbed; $$: DiscordMessage; renderer: Renderer }) {
	// console.log(embed);

	// this is apparently deprecated
	// embed.type;

	// it will always have thumbnail and url if it is an image embed
	// check
	// if embed type=image or type=gifv still exists
	// if not then check for things only found in image embeds
	// image embeds have no title, description, or fields

	// apparently webhooks will always have a rich embed
	const rich = props.$.type == "rich" || !!props.$$.$.webhook_id;

	return (
		<Show
			when={
				props.$.thumbnail &&
				props.$.url &&
				(props.$.type == "image" ||
					props.$.type == "gifv" ||
					(!props.$.title && !props.$.description && !props.$.fields))
			}
			fallback={
				<div class={styles.embed} style={props.$.color ? "--line_color:#" + props.$.color.toString(16) : ""}>
					<Show when={props.$.provider?.name}>
						<div class={styles.embedPName}>{props.$.provider!.name}</div>
					</Show>
					<Show when={props.$.author?.name}>
						<div class={styles.embedAName}>{props.$.author!.name}</div>
					</Show>
					<Show when={props.$.title}>
						<div class={styles.embedTitle}>
							<Show when={props.$.url} fallback={props.$.title}>
								<FocusableLink
									onNavigate={() => {
										window.open(props.$.url, "_blank");
									}}
									href={props.$.url}
								>
									{props.$.title}
								</FocusableLink>
							</Show>
						</div>
					</Show>
					<Show when={props.$.description}>
						<div class={styles.embedDesc}>
							<Markdown renderer={props.renderer} text={props.$.description!} />
						</div>
					</Show>
					<Show when={props.$.thumbnail}>
						<ImageThumbhash
							classList={{
								// [styles.thumb]: true,
								"v-image": true,
							}}
							$={props.$.thumbnail!}
							{...decideHeight(props.$.thumbnail!, 187, 50)}
							src={props.$.thumbnail!.proxy_url}
						/>
					</Show>
					<Show when={props.$}>
						<For each={props.$.fields}>
							{(field) => (
								<div classList={{ [styles.field]: true, [styles.inline]: field.inline }}>
									<div class={styles.fieldT}>
										<Markdown renderer={props.renderer} text={field.name} />
									</div>
									<div
									// class={styles["field-v"]}
									>
										<Markdown renderer={props.renderer} text={field.value} />
									</div>
								</div>
							)}
						</For>
					</Show>
					<Show when={props.$.image}>
						<ImageThumbhash
							classList={{
								// [styles.thumb]: true,
								"v-image": true,
							}}
							$={props.$.image!}
							src={props.$.image!.url}
							{...decideHeight(props.$.image!, 187)}
						/>
					</Show>
					<Show when={props.$.timestamp}>
						<div class={styles.timestamp}>{new Date(props.$.timestamp!).toLocaleDateString()}</div>
					</Show>
				</div>
			}
		>
			<Show
				when={props.$.type == "gifv" || (props.$.video && props.$.provider)}
				fallback={<ImageEmbed $={props.$ as APIEmbedWithThumbnail} />}
			>
				<GifVEmbed $={props.$ as APIEmbedWithThumbnail} />
			</Show>
		</Show>
	);
}

let contentFocusableCallback: (() => void) | null = null;
let currentID = "";
let toRemove = "";

export function makeContentFocusable(cb: () => void, id?: string) {
	if (contentFocusableCallback) return;
	pauseKeypress();

	currentID = id || createUniqueId();
	const newID = "images" + currentID;

	if (toRemove !== newID) {
		try {
			SpatialNavigation.remove(toRemove);
		} catch {}
		toRemove = "";

		SpatialNavigation.add(newID, {
			selector: ".msg-focused .v-image, .msg-focused .focusable-attachment",
			restrict: "self-only",
			rememberSource: true,
			enterTo: "last-focused",
		});
	} else {
		SpatialNavigation.enable(newID);
	}

	const hmm = SpatialNavigation.focus(newID);

	console.error("HMMMMM", hmm);

	window.addEventListener("keydown", onKeydownBackspace, true);

	if (!hmm) {
		makeContentUnfocusable();
		cb();
		return;
	}

	contentFocusableCallback = cb;
}

const [paused, setPaused] = createSignal(false);

function onKeydownBackspace(e: KeyboardEvent) {
	if (untrack(paused)) return;
	if (e.key == "Backspace") {
		makeContentUnfocusable();
	}
}

export function makeContentUnfocusable() {
	window.removeEventListener("keydown", onKeydownBackspace, true);

	(document.activeElement as HTMLElement).blur();
	toRemove = "images" + currentID;
	SpatialNavigation.disable("images" + currentID);
	resumeKeypress();

	contentFocusableCallback?.();
	contentFocusableCallback = null;
}

function ImageAttachment(props: { $: APIAttachment; onError: () => void }) {
	return (
		<ImageThumbhash
			onError={props.onError as any}
			class="v-image"
			data-filename={props.$.filename}
			data-url={props.$.url}
			src={props.$.proxy_url}
			$={props.$}
			{...decideHeight(props.$, 200)}
			// on:click={() => {
			// 	const { url: download, proxy_url: src, filename: file } = attachment;
			// 	showImage({ src, download, file });
			// }}
		/>
	);
}

function VideoAttachment(props: { $: APIAttachment; onError: () => void }) {
	const decision = () => decideHeight(props.$, 200);

	let blobSrc = "";

	const url = () => {
		const _ = new URL(props.$.proxy_url);
		const params = decision();

		if (params.height && params.width) {
			_.searchParams.set("width", String(params.width));
			_.searchParams.set("height", String(params.height));
		}

		_.searchParams.set("format", "png");

		return _.toString();
	};

	const poster = () => {
		const _url = url();
		return blobSrc || _url;
	};

	return (
		<div
			class={styles.video}
			style={{
				width: decision().width + "px",
				height: decision().height + "px",
			}}
		>
			<ImageThumbhash
				blobSrc={(url) => {
					blobSrc = url;
				}}
				onError={props.onError}
				class="v-image"
				data-filename={props.$.filename}
				data-url={props.$.url}
				src={url()}
				onClick={() => {
					setPaused(true);
					const $ = props.$;
					const close = fullscreen(() => (
						<VideoViewer
							poster={poster()}
							src={props.$.url}
							filename={"filename" in $ ? $.filename : undefined}
							onClose={async () => {
								await close?.();
								setPaused(false);
								makeContentUnfocusable();
							}}
						/>
					));
				}}
				{...decision()}
			/>
			<div class={styles.backdrop}></div>
			<div class={styles.play}>
				<svg
					class={styles.icon}
					role="img"
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						fill="currentColor"
						d="M9.25 3.35C7.87 2.45 6 3.38 6 4.96v14.08c0 1.58 1.87 2.5 3.25 1.61l10.85-7.04a1.9 1.9 0 0 0 0-3.22L9.25 3.35Z"
						class=""
					></path>
				</svg>
			</div>
		</div>
	);
}

export const secondsToHms = (_s: number) => {
	const s = Math.ceil(_s);
	return {
		hours: (s - (s % 3600)) / 3600,
		minutes: ((s - (s % 60)) / 60) % 60,
		seconds: s % 60,
	};
};

function AudioAttachment(props: { $: APIAttachment }) {
	const [playing, setPlaying] = createSignal(false);

	let audioEl!: HTMLAudioElement;

	const [focused, setFocused] = createSignal(false);

	const [time, setTime] = createSignal(0);
	const [duration, setDuration] = createSignal(0);

	const hours = () => secondsToHms(time()).hours;
	const minutes = () => secondsToHms(time()).minutes;
	const seconds = () => secondsToHms(time()).seconds;

	const totalHours = () => secondsToHms(duration() || props.$.duration_secs || duration()).hours;
	const totalMinutes = () => secondsToHms(duration() || props.$.duration_secs || duration()).minutes;
	const totalSeconds = () => secondsToHms(duration() || props.$.duration_secs || duration()).seconds;

	return (
		<div
			style={{
				outline: focused() ? "2px solid #5865f2" : "none",
			}}
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
			tabIndex={-1}
			on:sn-enter-down={() => {
				const audio = audioEl!;

				makeContentUnfocusable();

				if (untrack(playing)) {
					audio.pause();
					setPlaying(false);
					return;
				}

				audio.play();
				setPlaying(true);
			}}
			classList={{ "focusable-attachment": true, [styles.audio]: true, [styles.playing]: playing() }}
		>
			<div class={styles.button}>
				<Show
					when={playing()}
					fallback={
						<svg
							class="playIcon__25e6e"
							aria-hidden="true"
							role="img"
							xmlns="http://www.w3.org/2000/svg"
							width="12"
							height="12"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M9.25 3.35C7.87 2.45 6 3.38 6 4.96v14.08c0 1.58 1.87 2.5 3.25 1.61l10.85-7.04a1.9 1.9 0 0 0 0-3.22L9.25 3.35Z"
								class=""
							></path>
						</svg>
					}
				>
					<svg
						class="playIcon__25e6e"
						aria-hidden="true"
						role="img"
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M6 4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H6ZM15 4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3Z"
							class=""
						></path>
					</svg>
				</Show>
			</div>
			<div class={styles.secs}>
				<Show when={hours() > 0}>{`${hours()}:`}</Show>
				{("0" + minutes()).slice(-2)}:{("0" + seconds()).slice(-2)}
				{" / "}
				<Show when={totalHours() > 0}>{`${totalHours()}:`}</Show>
				{("0" + totalMinutes()).slice(-2)}:{("0" + totalSeconds()).slice(-2)}
			</div>
			<audio
				ref={audioEl}
				onTimeUpdate={() => {
					setTime(Math.floor(audioEl!.currentTime));
					setDuration(audioEl!.duration);
				}}
				onEnded={() => {
					const audio = audioEl!;

					audio.pause();
					audio.currentTime = 0;

					setPlaying(false);
					setTime(0);
				}}
				src={props.$.url}
			/>
		</div>
	);
}

function MessageAttachment(props: { $: APIAttachment }) {
	const [didError, setError] = createSignal(false);

	console.log(props.$.content_type);

	return (
		<Switch
			fallback={
				<FocusableLink
					onNavigate={() => {
						window.open(props.$.url, "_blank");
					}}
					react={
						<div class={styles.default_attachment}>
							<div class={styles.icon}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									fill="currentColor"
									class="bi bi-file-earmark"
									viewBox="0 0 16 16"
								>
									<path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
								</svg>
							</div>
							<div class={styles.text}>
								<div
								// class={styles.filename}
								>
									<a href={props.$.url}>{props.$.filename}</a>
								</div>
								<div class={styles.size}>{niceBytes(props.$.size)}</div>
							</div>
						</div>
					}
				/>
			}
		>
			<Match when={!didError() && props.$.content_type?.startsWith("image")}>
				<ImageAttachment
					onError={() => {
						setError(true);
					}}
					$={props.$}
				/>
			</Match>
			<Match when={!didError() && props.$.content_type?.startsWith("video")}>
				<VideoAttachment
					onError={() => {
						setError(true);
						console.error("DID ERROR VIDEO");
					}}
					$={props.$}
				/>
			</Match>
			<Match when={!didError() && props.$.content_type?.includes("audio")}>
				<AudioAttachment $={props.$} />
			</Match>
		</Switch>
	);
}

export default function MessageEmbeds(props: { $: DiscordMessage; renderer: Renderer }) {
	const embeds = useStore(() => props.$.embeds);
	const attachments = useStore(() => props.$.attachments);
	const stickers = useStore(() => props.$.stickers);

	return (
		<div class={styles.embeds + " kori-embeds"}>
			<For each={attachments()}>{(a) => <MessageAttachment $={a} />}</For>
			<For each={embeds()}>{(embed) => <MessageEmbed $$={props.$} $={embed} renderer={props.renderer} />}</For>
			<For each={stickers()}>
				{(a) => (
					<Show when={a.format_type == 3} fallback={<Sticker {...a} />}>
						<LottieSticker src={`https://discord.com/stickers/${a.id}.json`} />
					</Show>
				)}
			</For>
		</div>
	);
}
