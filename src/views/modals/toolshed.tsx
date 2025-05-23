import { JSXElement, Show, Suspense, createSignal, onCleanup, onMount, untrack } from "solid-js";
import * as styles from "./Toolshed.module.scss";
import { sleep } from "@/lib/utils";
import { Dynamic } from "solid-js/web";
import { setTransform } from "@/signals";

const [element, setElement] = createSignal<(() => JSXElement) | null>(null);

function ToolshedContainer() {
	let divRef!: HTMLDivElement;

	onMount(() => {
		setTransform(`translateY(-${divRef.clientHeight}px)`);
	});

	return (
		<div ref={divRef}>
			<Show when={element()}>
				<Dynamic component={element()!} />
			</Show>
		</div>
	);
}

export default function Toolshed() {
	return (
		<Show when={element()}>
			<div class={styles.Toolshed}>
				<ToolshedContainer />
			</div>
		</Show>
	);
}

export function toolshed(content: () => JSXElement) {
	if (untrack(element)) return null;

	setElement(() => content);

	return async function close() {
		// clear the transformation
		setTransform(undefined);
		// wait for class to be removed
		await sleep(0);
		// wait for transition to finish
		await sleep(301);
		setElement(null);
		// wait for element to be removed, so onCleanup will be called
		await sleep(1);
	};
}
