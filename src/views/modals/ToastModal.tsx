import { setToastQueue, toastQueue } from "./signals";
import * as styles from "./Toast.module.scss";
import { Show, createEffect, createSignal, onCleanup } from "solid-js";

export default function Toast() {
	const currentToast = () => toastQueue()[0];

	const [text, setText] = createSignal("");
	const [show, setShow] = createSignal(false);

	createEffect(() => {
		let timeout: Timer;

		if (currentToast()) {
			setShow(true);
			setText(currentToast().text);
			timeout = setTimeout(() => {
				setShow(false);
				timeout = setTimeout(() => {
					currentToast().promise.resolve(true);
					setToastQueue((e) => e.slice(1));
				}, 200);
			}, currentToast().duration);
		}

		onCleanup(() => {
			clearTimeout(timeout);
		});
	});

	return (
		<Show when={text()}>
			<div class={styles.toast + " " + (show() ? styles.show : styles.hidden)}>{text()}</div>
		</Show>
	);
}
