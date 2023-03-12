import "@lib/focusin.min.js";
import { useCallback, useContext, useEffect, useRef, useState } from "preact/hooks";
import { h, render, Component, Fragment, ComponentProps } from "preact";

import "./assets/global.scss";

import sn from "@lib/spatial_navigation";
sn.init();

import { route, Router, useRouter } from "preact-router";

import { InternetResults, sleep, testInternet, useMountDebug } from "./lib/utils";

import Loading from "@routes/Loading";
import { appReady, getToken } from "./lib/shared";
import Login from "./routes/Login";

async function loadDiscord() {
	route("/", true);

	appReady.value = false;

	const internetConnection = await testInternet();
	if (internetConnection !== InternetResults.OK) {
		if (InternetResults.EXPIRED_CERTS) {
			alert("You have expired certificate problem thing, go to the KaiStore to get the update.");
		} else {
			alert("You don't have internet go away");
		}
		return window.close();
	}

	if (!getToken()) {
		appReady.value = true;
		await sleep(100);
		route("/login", true);
		return;
	}

	appReady.value = true;
}

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
	useEffect(() => {
		loadDiscord();
	}, []);

	return appReady.value ? (
		<Router>
			<Login path="/login"></Login>
			<TestRoute path="test"></TestRoute>
		</Router>
	) : (
		<LoadingScreen />
	);
}

render(<App />, document.body);
