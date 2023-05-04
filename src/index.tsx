/* @refresh reload */
import { render } from "solid-js/web";
import "./assets/global.scss";

import "core-js/actual/array/flat";
import "core-js/actual/array/find-last";
import "core-js/actual/array/to-sorted";
import "core-js/actual/string/match-all";

import Button from "@components/Button";
import { createSignal } from "solid-js";
import { sleep } from "@utils";
import { Markdown } from "./components/Markdown";

import { sn } from "@shared";
import { Route, Router, Routes, hashIntegration, useLocation, useParams } from "@solidjs/router";
import { useMountDebug } from "./lib/hooks";
import Login from "./routes/Login";

sn.init();

function NullComponent() {
	return <></>;
}

/*

*/

function TestRoute() {
	const e = useParams();

	if (import.meta.env.DEV) useMountDebug("TestRoute");

	const [count, setCount] = createSignal(0);
	const [text, setText] = createSignal("Button");

	return (
		<>
			<h1>Welcome</h1>
			<div>
				<Markdown text={text()} />
				{JSON.stringify(e)}
			</div>
			<div>
				<textarea value={text()} onInput={(e) => setText(e.target.value)} />
			</div>
			<Button
				onClick={async () => {
					//await sleep(400);
					setCount((count) => count + 1);
				}}
			>
				<Markdown text={text()} />
				{count()}
			</Button>
		</>
	);
}

function App() {
	return (
		<Router source={hashIntegration()}>
			<Routes>
				<Route path="/test/:customparam?" component={TestRoute} />
				<Route path="/login" component={Login} />
			</Routes>
		</Router>
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

	Promise.all([import("solid-js"), import("solid-js/web"), import("@utils"), import("@solidjs/router")]).then(
		([solidjs, solidjs_web, utils, router]) => {
			Object.assign(window, utils, { utils, solidjs, solidjs_web, router });
		}
	);
}
