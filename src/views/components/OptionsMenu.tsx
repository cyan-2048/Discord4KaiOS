import { For, JSXElement, Show, onCleanup, onMount } from "solid-js";
import * as styles from "./OptionsMenu.module.scss";
import { Dynamic } from "solid-js/web";
import SpatialNavigation from "@/lib/spatial_navigation";
import { pauseKeypress, resumeKeypress, sleep } from "@/lib/utils";

const SN_ID = "options-menu";

type OptionItem = {
	id?: number | string | symbol;
	text?: string;
	react?: () => JSXElement;
	icon?: () => JSXElement;
	caret?: boolean;
};

export function OptionsMenu(props: {
	onSelect: (a: OptionItem["id"] | null) => void;
	items: Array<OptionItem | null | false | undefined>;
}) {
	onMount(() => {
		if (props.items.filter((a) => a).length == 0) {
			Promise.resolve().then(() => props.onSelect(null));
			return;
		}

		pauseKeypress();

		SpatialNavigation.add(SN_ID, {
			restrict: "self-only",
			selector: `.${styles.item}`,
		});

		SpatialNavigation.focus(SN_ID);
	});

	onCleanup(() => {
		if (props.items.filter((a) => a).length == 0) {
			return;
		}
		(document.activeElement as HTMLElement)?.blur();
		SpatialNavigation.remove(SN_ID);

		resumeKeypress();
	});

	let selected = false;

	function onSelect(select: Parameters<typeof props.onSelect>[0]) {
		if (selected) return;
		props.onSelect(select);
		selected = true;
	}

	return (
		<div class={styles.menu}>
			<For each={props.items.filter((a) => a) as OptionItem[]}>
				{(option) => (
					<div
						on:sn-enter-down={() => {
							onSelect(option.id);
						}}
						onKeyDown={(e) => {
							if (e.key == "Backspace") {
								onSelect(null);
							}
						}}
						tabIndex={-1}
						class={styles.item}
					>
						<Show when={option.react} fallback={<Show when={option.text}>{option.text}</Show>}>
							<Dynamic component={option.react} />
						</Show>
						<Show when={option.icon}>
							<div class={styles.icon}>
								<Dynamic component={option.icon} />
							</div>
						</Show>
					</div>
				)}
			</For>
		</div>
	);
}
