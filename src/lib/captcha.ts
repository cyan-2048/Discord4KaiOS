import Deferred from "discord/src/lib/Deffered";

export enum CaptchaResult {
	SUCCESS,
	ERROR,
	CANCELLED,
}

type Result =
	| {
			result: CaptchaResult.ERROR | CaptchaResult.CANCELLED;
	  }
	| {
			result: CaptchaResult.SUCCESS;
			token: string;
			ekey: string;
	  };

const prefix = "captcha_verified_";

export default async function captcha(sitekey: string) {
	const deffered = new Deferred<Result>();

	const popup = window.open("https://discord4kaios.github.io/discord_captcha_different_origin#" + sitekey, "", "popup,width=240,height=320");

	let done = false,
		timeout: Timer;

	function checkIfClosed() {
		if (done) {
			return;
		}
		if (!popup || popup.closed) {
			removeOnMessage();
			deffered.resolve({ result: CaptchaResult.CANCELLED });
			done = true;
		} else {
			timeout = setTimeout(checkIfClosed, 1000);
		}
	}

	let token: string, ekey: string;

	function removeOnMessage() {
		window.removeEventListener("message", onMessage);
		done = true;
		clearTimeout(timeout);
	}

	function onMessage(evt: MessageEvent) {
		const data = evt.data;
		if (typeof data == "string" && data.startsWith(prefix)) {
			// console.log("WAAAAAAAAAAAWWWW");
			if (data.startsWith(prefix + "token")) {
				// console.log("WAAWAAA TOKEN");
				// token = data.slice(prefix.length + "token:".length);
				token = data.slice(23);
			} else {
				// console.log("WAAWAAA EKEY");
				ekey = data.slice(22);
			}
		}
		if (typeof token == "string" && typeof ekey == "string") {
			// console.log("WAWWW");
			removeOnMessage();
			popup?.close();
			deffered.resolve({ result: CaptchaResult.SUCCESS, token, ekey });
		}
	}

	window.addEventListener("message", onMessage);
	checkIfClosed();

	return deffered.promise;
}
