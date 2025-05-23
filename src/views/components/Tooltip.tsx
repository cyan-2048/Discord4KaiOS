import * as styles from "./Tooltip.module.scss";
import { normalizeCSSNumber } from "@/lib/utils";
import { createEffect, createSignal, JSX } from "solid-js";

interface TooltipProps {
	maxWidth?: number | null;
	maxHeight?: number | null;
	x?: number | null;
	y?: number | null;
	children: JSX.Element;
}

export default function Tooltip(props: TooltipProps) {
	const [top, setTop] = createSignal<number | null>(null);

	let divRef!: HTMLDivElement;

	createEffect(() => {
		if (divRef && typeof props.y == "number") {
			const height = divRef.clientHeight;
			setTop(props.y - height / 2);
		}
	});

	return (
		<div
			ref={divRef}
			style={{
				"max-width": normalizeCSSNumber(props.maxWidth),
				"max-height": normalizeCSSNumber(props.maxHeight),
				left: normalizeCSSNumber(props.x),
				top: normalizeCSSNumber(top()),
			}}
			class={styles.tooltip}
		>
			<div classList={{ [styles.arrow]: true, [styles.left]: true }}></div>
			<div class={styles.body}>{props.children}</div>
		</div>
	);
}
