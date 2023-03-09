import "@lib/focusin.min.js";
import { useCallback, useContext, useEffect, useRef } from "preact/hooks";
import { h, render, Component, Fragment, ComponentProps } from "preact";

import "./assets/global.scss";

import sn from "@lib/spatial_navigation";
sn.init();

import { route, Router, useRouter } from "preact-router";

import { centerScroll, InternetResults, sleep, testInternet } from "./lib/utils";

import { signal } from "@preact/signals";
import Loading from "@routes/Loading";
import { appReady } from "./lib/shared";
import Login from "./routes/Login";

async function loadDiscord() {
	const internetConnection = await testInternet();
	if (internetConnection !== InternetResults.OK) {
		if (InternetResults.EXPIRED_CERTS) {
			alert("You have expired certificate problem thing, go to the KaiStore to get the update.");
		} else {
			alert("You don't have internet go away");
		}
		return window.close();
	}

	appReady.value = true;
	// await sleep(100);

	route("/login", true);
}

loadDiscord();

function App() {
	return (
		<>
			<Router>
				<Login path="/login"></Login>
			</Router>
			{!appReady.value && <Loading></Loading>}
		</>
	);
}

render(<App />, document.body);
