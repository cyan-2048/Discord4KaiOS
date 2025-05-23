import Zoom, { ZoomRef } from "@/lib/zoom";
import * as styles from "./ImageViewer.module.scss";
import { pauseKeypress, resumeKeypress, useKeypress } from "@/lib/utils";
import { createSignal, onCleanup, onMount } from "solid-js";
import SpatialNavigation from "@/lib/spatial_navigation";
import { slide } from "../modals/slide";
import { OptionsMenu } from "./OptionsMenu";
import DownloadIcon from "../../icons/DownloadIcon.svg";

export default function ImageViewer(props: {
	filename?: string;
	src: string;
	onClose?: () => void;
	originalSrc?: string;
}) {
	let divRef!: HTMLDivElement;

	onMount(() => {
		pauseKeypress();
		SpatialNavigation.add("image-viewer", {
			restrict: "self-only",
			selector: `.${styles.viewer}`,
		});
		SpatialNavigation.focus("image-viewer");
	});

	onCleanup(() => {
		SpatialNavigation.remove("image-viewer");
		divRef?.blur();
		resumeKeypress();
	});

	let zoomRef: ZoomRef | undefined;

	const [pixelated, setPixelated] = createSignal(false);

	useKeypress(
		"3",
		() => {
			if (zoomRef) {
				if (zoomRef.scaleValue >= 3) setPixelated(true);
				if (zoomRef.scaleValue <= 11) zoomRef.zoomIn();
			}
		},
		true
	);
	useKeypress(
		"1",
		() => {
			if (zoomRef) {
				if (zoomRef.scaleValue <= 3) setPixelated(false);
				zoomRef.zoomOut();
			}
		},
		true
	);

	let backspacePaused = false;

	useKeypress(
		"SoftRight",
		() => {
			const src = props.originalSrc || props.src;
			if (src) {
				const actEl = document.activeElement as HTMLElement;
				console.log("SHOW OPTIONS MENU");
				backspacePaused = true;
				const close = slide(() => (
					<OptionsMenu
						items={[{ text: "Download", id: "download", icon: () => <DownloadIcon /> }]}
						onSelect={async (item) => {
							backspacePaused = false;
							await close?.();
							actEl.focus();
							switch (item) {
								case "download":
									if (props.src.startsWith("blob:") && props.filename) {
										const a = document.createElement("a");
										a.href = props.src;
										a.download = props.filename || "";
										document.body.appendChild(a);
										a.click();
										a.remove();
									} else {
										window.open(src, "_blank");
									}
									break;
							}
						}}
					/>
				));
			}
		},
		true
	);

	useKeypress(
		["Up", "Down", "Left", "Right"].map((a) => "Arrow" + a),
		({ key }) => {
			const offset = 50;

			const moveImage = zoomRef?.moveImage;
			if (!moveImage) return;

			switch (key.slice(5)) {
				case "Up":
					moveImage(0, offset);
					break;
				case "Down":
					moveImage(0, -offset);
					break;
				case "Left":
					moveImage(offset, 0);
					break;
				case "Right":
					moveImage(-offset, -0);
					break;
			}
		},
		true
	);

	useKeypress(
		"Backspace",
		() => {
			if (!backspacePaused) props.onClose?.();
		},
		true
	);

	return (
		<div ref={divRef} tabIndex={-1} classList={{ [styles.viewer]: true, [styles.pixelated]: pixelated() }}>
			<Zoom
				ref={(e) => {
					zoomRef = e;
				}}
				src={props.src}
			/>
		</div>
	);
}
