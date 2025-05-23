import * as styles from "./MainView.module.scss";
import Channels from "./views/Channels";
import Guilds from "./views/Guilds";
import Messages from "./views/Messages";
import { discordClient, restartApp, setCurrentView, transform, Views, integrityCheck } from "./signals";
import { createSignal, onMount, untrack, JSX } from "solid-js";
import { fullscreen } from "./views/modals/fullscreen";
import IntegrityCheckFailed from "./views/IntegrityCheckFailed";
import { sleep } from "./lib/utils";

export default function MainView() {
	setCurrentView(Views.GUILDS);

	onMount(() => {
		untrack(discordClient)!.once("close", () => {
			restartApp();
		});

		integrityCheck.then(async (e) => {
			await sleep(1000);
			if (!e) {
				const actEl = document.activeElement as HTMLElement;
				actEl.blur();
				const close = fullscreen(() => (
					<IntegrityCheckFailed
						onClose={async () => {
							await close?.();
							actEl.focus();
						}}
					/>
				));
			}
		});

		document.querySelector<HTMLDivElement>(".LOADING")?.style.setProperty("display", "none");
	});

	return (
		<div
			style={{
				transform: transform(),
			}}
			class={styles.mainView}
		>
			<Guilds />
			<Channels />
			<Messages />
		</div>
	);
}
