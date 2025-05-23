import { Setter, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import * as styles from "./IntegrityCheckFailed.module.scss";
import SpatialNavigation from "@/lib/spatial_navigation";
function Timer(props: { time: number; setTime: Setter<number> }) {
	onMount(() => {
		let timer = setInterval(() => {
			props.setTime((time) => {
				if (time === 0) {
					clearInterval(timer);
					return 0;
				} else return time - 1;
			});
		}, 1000);
		onCleanup(() => {
			clearInterval(timer);
		});
	});

	return (
		<div>
			Time left: {`${Math.floor(props.time / 60)}`.padStart(2, "0")}:{`${props.time % 60}`.padStart(2, "0")}
		</div>
	);
}

export default function IntegrityCheckFailed(props: { onClose: () => void }) {
	const [time, setTime] = createSignal(90);

	createEffect(() => {
		const _time = time();
		if (_time === 0) {
			props.onClose();
		}
	});

	onMount(() => {
		SpatialNavigation.pause();
	});

	onCleanup(() => {
		SpatialNavigation.resume();
	});

	return (
		<div class={styles.trolleee}>
			<div class={styles.warning}>⚠️</div>
			<div>The app's code has been tampered with.</div>
			<div>You risk your token being compromised.</div>
			<div>only install the app from here: https://github.com/Discord4KaiOS/</div>
			<Timer time={time()} setTime={setTime} />
		</div>
	);
}
