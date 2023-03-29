import "core-js/actual/array/flat";
import "core-js/actual/array/find-last";
import "core-js/actual/string/match-all";
import "preact/debug";

import { Fragment, h, render } from "preact";

import "./assets/global.scss";
import "@lib/focusin.min.js";

import { useMount, useMountDebug } from "./lib/utils";
import { appReady, loadDiscord, sn } from "./lib/shared";
sn.init();

import { Router } from "preact-router";
import Match from "preact-router/match";
import Loading from "@routes/Loading";
import Login from "@routes/Login";
import Channels from "@routes/Channels";
import Button from "@components/Button";
import { useState } from "preact/hooks";

function TestRoute(props: any) {
	useMountDebug("TestRoute");

	return (
		<>
			<div>Test Route</div>
			<Button
				onClick={() => {
					history.back();
				}}
			>
				Go Back
			</Button>
		</>
	);
}

function App() {
	useMountDebug("App");
	useMount(() => {
		loadDiscord();
	});

	const [guildID, setGuild] = useState("");
	const [mounted, setMounted] = useState(false);
	const [channelsHidden, setHidden] = useState(false);

	// /channels/@me/823842249069953036

	return appReady.value ? (
		<>
			<Router
				onChange={(props) => {
					if (props.matches?.guildID) {
						setGuild(props.matches.guildID);
						!mounted && setMounted(true);
						setHidden(false);
					} else {
						setHidden(true);
					}

					console.log(props.matches);
				}}
			>
				<Login path="/login"></Login>
				<TestRoute path="/test"></TestRoute>
				<Match path="/channels/:guildID/:channelID?">{() => <></>}</Match>
			</Router>
			{mounted && <Channels hidden={channelsHidden} guildID={guildID}></Channels>}
			<div>{guildID}</div>
		</>
	) : (
		<Loading />
	);
}

render(<App />, document.body);
