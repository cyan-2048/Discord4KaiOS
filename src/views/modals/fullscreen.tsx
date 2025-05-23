import { JSXElement, Show, createSignal, untrack } from "solid-js";
import * as styles from "./Fullscreen.module.scss";
import { sleep } from "@/lib/utils";
import { Dynamic } from "solid-js/web";
import { setTransform } from "@/signals";

const [element, setElement] = createSignal<(() => JSXElement) | null>(null);
const [open, setOpen] = createSignal(false);

export default function FullscreenModal() {
	return (
		<Show when={element()}>
			<div
				classList={{
					[styles.fullscreen]: true,
					[styles.open]: Boolean(open()),
				}}
			>
				<Dynamic component={element()!} />
			</div>
		</Show>
	);
}

export function fullscreen(content: () => JSXElement) {
	if (untrack(element)) return null;

	setElement(() => content);
	setTransform("scale(0)");
	sleep(0).then(() => setOpen(true));

	return async function close() {
		setTransform(undefined);
		setOpen(false);
		// wait for class to be removed
		await sleep(0);
		// wait for transition to finish
		// add 100ms because this jumps on KaiOS 2.5
		await sleep(401);
		setElement(null);
		// wait for element to be removed, so onCleanup will be called
		await sleep(1);
	};
}
