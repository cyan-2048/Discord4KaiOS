import "preact/debug";

import "core-js/actual/array/flat";
import "core-js/actual/array/find-last";
import "core-js/actual/array/to-sorted";
import "core-js/actual/string/match-all";

import { ComponentChild, Fragment, JSX, RenderableProps, h, render } from "preact";

import "./assets/global.scss";
import "@lib/focusin.min.js";

import { useCallback, useInputValue, useMount, useMountDebug, useRef, useState } from "@hooks";
import { appReady, loadDiscord, sn } from "./lib/shared";
sn.init();

import { Router } from "preact-router";

import Loading from "@routes/Loading";
import Login from "@routes/Login";
import Channels from "@routes/Channels";
import Button from "@components/Button";
import Messages from "@routes/Messages";
import { Markdown } from "./components/Markdown";
import VirtualList from "./components/VirtualList";
import { computed, signal, useComputed } from "@preact/signals";
import { PureComponent, memo } from "preact/compat";

function TestRoute(props: any) {
	useMountDebug("TestRoute");

	const textarea = useRef<HTMLTextAreaElement>(null);

	const [text] = useInputValue(textarea);

	return (
		<>
			<div>Test Routec {Math.random()}</div>
			<div>
				<Markdown text={text}></Markdown>
			</div>
			<textarea ref={textarea} cols={30} rows={10}></textarea>
			<Button
				onClick={useCallback(() => {
					history.back();
				}, [])}
			>
				Go Back
			</Button>
		</>
	);
}

function NullComponent(props: { path: string }) {
	return null as JSX.Element;
}

function App() {
	useMountDebug("App");
	useMount(() => {
		loadDiscord();
	});

	const [guildID, setGuild] = useState("");
	const [channelsMounted, setChannelsMounted] = useState(false);
	const [channelsHidden, setChannelsHidden] = useState(false);

	const [messagesMounted, setMessagesMounted] = useState(false);
	const [messagesHidden, setMessagesHidden] = useState(false);
	const [channelID, setChannel] = useState("");

	// /channels/@me/823842249069953036

	return appReady.value ? (
		<>
			<Router
				onChange={(props) => {
					if (props.matches?.guildID) {
						setGuild(props.matches.guildID);
						!channelsMounted && setChannelsMounted(true);
						if (props.matches.channelID) {
							!messagesMounted && setMessagesMounted(true);
							setChannel(props.matches.channelID);
							setChannelsHidden(true);
							setMessagesHidden(false);
							return;
						} else {
							setMessagesHidden(true);
						}
						setChannelsHidden(false);
					} else {
						setChannelsHidden(true);
					}
				}}
			>
				<Login path="/login"></Login>
				<TestRoute path="/test"></TestRoute>
				<NullComponent path="/channels/:guildID/"></NullComponent>
				<NullComponent path="/channels/:guildID/:channelID"></NullComponent>
			</Router>
			{channelsMounted && <Channels hidden={channelsHidden} guildID={guildID}></Channels>}
			{messagesMounted && <Messages hidden={messagesHidden} channelID={channelID}></Messages>}
		</>
	) : (
		<Loading />
	);
}

render(<App />, document.body);

/*/ Testing the virtuallist

const focused = signal(0);

function FocusedListItem(props) {
	const focus = focused == props.i;
	return <ListItem {...props} focused={focus}></ListItem>;
}

const ListItem = memo((props: any) => {
	const el = useRef<HTMLDivElement>(null);

	useMount(() => {
		if (focused.peek() == props.i) {
			el.current.focus();
		}
	});
	return (
		<div ref={el} tabIndex={props.i} style={{ color: props.focused ? "red" : null }}>
			item {props.i} {Math.random()}
			<style>{`*:focus { color: red }`}</style>
		</div>
	);
});

const listOfJSXElements = Array(100)
	.fill(0)
	.map((_, i) => (
		<Fragment key={i}>
			<ListItem i={i}></ListItem>
		</Fragment>
	));

function VirtualListTest() {
	const el = useRef<HTMLDivElement>(null);

	return (
		<div
			ref={el}
			onKeyDownCapture={({ key }) => {
				if (key == "ArrowUp") {
					focused.value--;
				} else if (key == "ArrowDown") {
					focused.value++;
				}
				// @ts-ignore
				el.current.querySelector(`[tabindex="${focused.peek()}"]`)?.focus();
			}}
		>
			<button onClick={() => focused.value--}>Prev</button>
			<button onClick={() => focused.value++}>Next</button>
			<VirtualList range={5} items={listOfJSXElements} focusedIndex={focused.value}></VirtualList>
		</div>
	);
}

render(<VirtualListTest />, document.body);

*/
if (import.meta.env.DEV) {
	import("./dev");
}
