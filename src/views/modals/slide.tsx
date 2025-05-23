import { JSXElement, Show, Suspense, createSignal, onCleanup, onMount, untrack } from "solid-js";
import * as styles from "./Slide.module.scss";
import { sleep } from "@/lib/utils";
import { Dynamic } from "solid-js/web";

const [open, setOpen] = createSignal(false);

const [element, setElement] = createSignal<(() => JSXElement) | null>(null);

function SlideContainer() {
	let divRef!: HTMLDivElement;

	return (
		<div
			classList={{
				[styles.container]: true,
				[styles.open]: open(),
			}}
			ref={divRef}
		>
			<Show when={element()}>
				<Dynamic component={element()!} />
			</Show>
		</div>
	);
}

export default function Slide() {
	return (
		<Show when={element()}>
			<div classList={{ [styles.Slide]: true, [styles.open]: open() }}>
				<SlideContainer />
			</div>
		</Show>
	);
}

export function slide(content: () => JSXElement) {
	if (untrack(element)) return null;

	setElement(() => content);
	sleep(2).then(() => setOpen(true));

	return async function close() {
		// clear the transformation
		setOpen(false);
		// wait for class to be removed
		await sleep(0);
		// wait for transition to finish
		await sleep(301);
		setElement(null);
		// wait for element to be removed, so onCleanup will be called
		await sleep(1);
	};
}
