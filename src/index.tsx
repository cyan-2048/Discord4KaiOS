/* @refresh reload */
import { render } from "solid-js/web";
import Button from "@components/Button";
import { createSignal } from "solid-js";
import { sleep } from "@utils";
import { Markdown } from "./components/Markdown";

function App() {
	const [count, setCount] = createSignal(0);
	const [text, setText] = createSignal("Button");

	return (
		<div>
			<h1>Welcome</h1>
			<textarea value={text()} onInput={(e) => setText(e.target.value)} />
			<Button
				onClick={async () => {
					//await sleep(500);
					setCount((count) => count + 1);
				}}
			>
				<Markdown text={text()} />
				{" " + count()}
			</Button>
		</div>
	);
}

const dispose = render(() => <App />, document.body);

if (import.meta.hot) {
	import.meta.hot.accept();
	import.meta.hot.dispose(dispose);
}

if (import.meta.env.DEV) {
	console.log("DEV MODE");
	function softkey(e: KeyboardEvent) {
		const { target, key, bubbles, cancelable, repeat, type } = e;
		if (!/Left|Right/.test(key) || !key.startsWith("Arrow") || !e.ctrlKey) return;
		e.stopImmediatePropagation();
		e.stopPropagation();
		e.preventDefault();
		target.dispatchEvent(new KeyboardEvent(type, { key: "Soft" + key.slice(5), bubbles, cancelable, repeat }));
	}

	document.addEventListener("keyup", softkey, true);
	document.addEventListener("keydown", softkey, true);
}
