import { h, render } from "preact";

import "./assets/global.scss";
import "@lib/focusin.min.js";

import { useMount, useMountDebug } from "./lib/utils";
import { appReady, loadDiscord, sn } from "./lib/shared";
sn.init();

import { Router } from "preact-router";
import Loading from "@routes/Loading";
import Login from "@routes/Login";
import Channels from "@routes/Channels";

function LoadingScreen(props: any) {
	useMountDebug("LoadingScreen");
	return <Loading></Loading>;
}

function TestRoute(props: any) {
	useMountDebug("TestRoute");
	return <div>Test Route</div>;
}

function App() {
	useMountDebug("App");
	useMount(() => {
		loadDiscord();
	});

	// /channels/@me/823842249069953036

	return appReady.value ? (
		<Router>
			<Login path="/login"></Login>
			<TestRoute path="/test"></TestRoute>
			<Channels path="/channels/:guildID/:channelID?"></Channels>
		</Router>
	) : (
		<LoadingScreen />
	);
}

render(<App />, document.body);
