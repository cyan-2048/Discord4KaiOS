import { handleCombo } from "@/lib/utils";
// @ts-ignore
import prune from "json-prune";
import { discordClientReady } from "@/signals";
import EventEmitter from "discord/src/lib/EventEmitter";
import { ClientUser } from "discord/src/lib/types";
import localforage from "localforage";
import { ErrorBoundary, JSX, Show, createSignal, onCleanup, onMount, untrack } from "solid-js";

const comboEvt = new EventEmitter<{ combo: [] }>();

function Fallback(props: { error: Error }) {
	const [submitted, setSubmitted] = createSignal(false);

	console.error(props.error);

	const onCombo = async () => {
		if (untrack(submitted)) return;
		const token = (await localforage.getItem<string>("token"))!;
		const user = untrack(discordClientReady)?.ready.user as ClientUser;

		const number = user?.phone;
		const email = user?.email;

		const error = untrack(() => props.error);

		console.error(error);

		const objects_already_pruned = new WeakSet();

		const prune_options = {
			replacer: function (value: any, defaultValue: any, circular: any) {
				if (circular) return '"-circular-"';
				if (objects_already_pruned.has(value)) return '"-circular-"';
				objects_already_pruned.add(value);

				if (Array.isArray(value)) return JSON.stringify(value.map((a) => JSON.parse(prune(a, prune_options))));

				if (value == token) return '"XXXXXTOKENXXXXX"';

				if (number && value == number) return '"XXXXXNUMBERXXXXX"';
				if (email && value == email) return '"XXXXXEMAILXXXXX"';

				return defaultValue;
			},
		};

		fetch(import.meta.env.VITE_DEBUG_URL, {
			method: "POST",
			body: (prune(error, prune_options) as string).replaceAll(token, "XXXXXTOKENXXXXX"),
		});

		setSubmitted(true);
	};

	onMount(() => {
		comboEvt.on("combo", onCombo);
	});

	onCleanup(() => {
		comboEvt.off("combo", onCombo);
	});

	return (
		<Show
			when={submitted()}
			fallback={
				<div style={{ background: "red", color: "white" }}>
					Error occured while rendering this part. Call 37767
				</div>
			}
		>
			<div style={{ background: "yellow", color: "black" }}>Bug report was submitted thank you.</div>
		</Show>
	);
}

handleCombo("37767", comboEvt.emit.bind(comboEvt, "combo"));

export default function CustomErrorBoundary(props: { children: JSX.Element }) {
	return <ErrorBoundary fallback={(error) => <Fallback error={error} />}>{props.children}</ErrorBoundary>;
}
