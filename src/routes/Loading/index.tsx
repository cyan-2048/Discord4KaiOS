import { Markdown } from "@components/Markdown";
import { appReady } from "@/main.js";
import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import "./style.scss";

const getRandomText = randomNoRepeats([
	"Quickly edit your last sent message! Type 's/[what to replace]/[what to replace with]'.",
	`Press 0 at any point in message history to scroll to the latest.`,
	"This application is open-sourced at https://github.com/cyan-2048/Discord4KaiOS",
	"We have a dedicated Discord server for support on this application! Check it out in Settings.",
	"Don't ask for ETAs. No 'When will *something* arrive?'. We're all humans.",
	"never gonna give you up",
	"We're connecting to Discord's gateways to retrieve account info, server list and message history. Be patient!",
	"This app is a fork of Frank128's Discord-KaiOS-Unofficial.",
	"The app 99% only connects to discord's servers!",
	"The Discord API Docs gives you enough information to create your own Discord Client.",
]);

function randomNoRepeats(array: any[]) {
	var copy = array.slice(0);
	return function () {
		if (copy.length < 1) {
			copy = array.slice(0);
		}
		var index = Math.floor(Math.random() * copy.length);
		var item = copy[index];
		copy.splice(index, 1);
		return item;
	};
}

export default function Loading() {
	const [text, setText] = useState(getRandomText());

	useEffect(() => {
		const interval = setInterval(() => {
			setText(getRandomText());
		}, 4000);

		return () => clearInterval(interval);
	});

	return (
		<div class="Loading">
			<img src="/css/loading.png" />
			<div id="dyk">DID YOU KNOW</div>
			<div id="fact">{typeof text == "string" ? <Markdown text={text} /> : <>{text}</>}</div>
		</div>
	);
}
