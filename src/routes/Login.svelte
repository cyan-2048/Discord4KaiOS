<script>
	import { sn } from "../lib/shared";
	import { onMount, tick } from "svelte";
	import { discord, localStorage } from "../lib/database.js";
	import { centerScroll, reload } from "../lib/helper.js";
	import { navigate } from "svelte-routing";
	import Button from "../components/Button.svelte";

	async function testToken(authorization) {
		const settings = await discord.xhrRequestJSON("GET", "users/@me", { authorization });
		if (settings.code === 0) throw settings;
		return settings;
	}

	export let _done;
	_done = false;

	let email = "",
		password = "",
		token = "",
		auth = "",
		main;

	let page = 0;
	$: if (page > -1)
		tick().then(() => {
			sn.makeFocusable();
			sn.focus();
		});

	function done(token) {
		_done = true;
		localStorage.token = token;
		reload();
	}

	onMount(() => {
		sn.add({
			selector: `[data-login] input, [data-login] button`,
			id: "_login",
			restrict: "self-only",
		});
		sn.makeFocusable("_login");
		sn.focus("_login");
		return () => sn.remove("_login");
	});

	let state = {
		email: null,
		password: null,
		token: null,
		auth: null,
	};

	let auth_onclick = Promise.resolve();

	async function mfa(ticket) {
		auth = "";
		page = 2;
		let token = await new Promise((s, e) => {
			auth_onclick = async () => {
				let len = auth.length;
				if (auth === "") state.auth = "required";
				else if (isNaN(auth) || len < 0 || len > 8) {
					state.auth = "invalid";
				} else {
					let res = await discord.xhrRequestJSON("post", "auth/mfa/totp", {}, { ticket, code: auth });
					if (!res.token) e(res);
					auth_onclick = Promise.resolve();
					s(res.token);
				}
			};
		});
		return token;
	}

	async function login() {
		if (!email) state.email = "required";
		if (!password) state.password = "required";
		if (!password || !email) return;
		let a = await discord.xhrRequestJSON("post", "auth/login", {}, { email, password });
		if (a.errors) return alert(a.message);
		if (a.captcha_service) {
			return alert("you are being captcha-ed! please use a token instead.");
		}
		let token = a.token;
		try {
			if (a.mfa) token = await mfa(a.mfa);
			await testToken(token);
			done(token);
		} catch (e) {
			alert("Error :" + JSON.stringify(e));
		}
	}

	import QRCode from "../lib/qrCode";

	async function scanToken() {
		const qrcode = new QRCode();
		sn.pause();
		try {
			let token = await qrcode.readAsText();
			if (!token) return sn.resume();
			await testToken(token);
			done(token);
			localStorage.fromToken = true;
		} catch (e) {
			alert("Error :" + JSON.stringify(e));
		}
		sn.resume();
	}

	function kai_picker() {
		return new Promise((res, err) => {
			let e = new MozActivity({ name: "pick", data: { type: "text/plain" } });
			function success() {
				let blob = e.result.blob;
				if (!blob || blob.type !== "text/plain") {
					e = { error: { name: "Not a text file!", message: `the blob type was: ` + blob.type } };
					return error();
				}
				let url = URL.createObjectURL(blob);
				fetch(url)
					.then((r) => r.text())
					.then((r) => {
						URL.revokeObjectURL(url);
						res(r);
					});
			}
			function error() {
				if (e.error.name == "NO_PROVIDER") {
					e = new MozActivity({ name: "pick" });
					e.onsuccess = success;
					e.onerror = error;
				} else {
					alert("an error occured while getting the file." + `\n${e.error.name || ""} \n${e.error.message || ""}`);
					res(null);
				}
			}
			e.onerror = error;
			e.onsuccess = success;
		});
	}

	async function useFile() {
		let token = null;
		try {
			const res = await fetch("/token.txt");
			const data = await res.text();
			if (!data) throw Error("no data");
			if (confirm("token.txt found in the app package, do you want to use that?")) {
				token = data;
			} else throw new Error();
		} catch (e) {
			if (typeof MozActivity === "function") {
				token = await kai_picker();
			} else token = prompt("only works on KaiOS device!");
		}
		if (token)
			try {
				await testToken(token);
				done(token);
				localStorage.fromToken = true;
			} catch (e) {
				alert("Error :" + JSON.stringify(e));
			}
	}
</script>

<svelte:window
	on:keydown={(e) => {
		let { target, key } = e;
		if (key === "Enter") target.click();
		if (key === "Backspace") {
			if (target.tagName !== "INPUT" || target.value === "") {
				e.preventDefault();
				if (page > 0) page = 0;
				else window.close();
			}
		}
	}}
	on:sn:willmove={(e) => {
		let {
			detail: { direction },
			target,
		} = e;
		if (/left|right/.test(direction) && target.tagName == "INPUT") {
			((len) => {
				let el = document.activeElement;
				let length = el.value.length;
				if (len > length) len = length;
				if (len < 0) len = 0;
				el.selectionEnd = len;
				el.selectionStart = len;
			})(target.selectionStart + (direction == "left" ? -1 : 1));
		}
		setTimeout(() => centerScroll(document.activeElement), 50);
	}}
/>

<main bind:this={main} data-login>
	{#if page === 0}
		<div class="separator {state.email ? 'red' : ''}">
			EMAIL OR PHONE NUMBER{#if state.email === "required"} - <i>This field is required</i>{/if}
		</div>
		<input bind:value={email} type="text" />
		<div class="separator {state.password ? 'red' : ''}">
			PASSWORD{#if state.password === "required"} - <i>This field is required</i>{/if}
		</div>
		<input bind:value={password} type="password" />
		<Button onClick={login}>Login</Button>
		<Button onClick={() => (page = 1)}>Login with Token</Button>
	{:else if page === 1}
		<div class="separator {state.token ? 'red' : ''}">
			TOKEN{#if state.token === "required"} - <i>This field is required</i>{/if}
		</div>
		<input bind:value={token} type="password" />
		<Button
			onClick={async () => {
				try {
					await testToken(token);
					done(token);
					localStorage.fromToken = true;
				} catch (e) {
					alert("Error :" + JSON.stringify(e));
				}
			}}>Login</Button
		>
		<Button onClick={useFile}>Use token.txt file</Button>
		<Button onClick={scanToken}>Scan QR that contains token</Button>
		<Button onClick={() => (page = 0)}>Go Back</Button>
	{:else if page === 2}
		<div class="separator {state.auth ? 'red' : ''}">
			ENTER DISCORD AUTH/BACKUP CODE{#if state.auth === "required"}
				- <i>This field is required</i>{/if}{#if state.auth === "invalid"}<i> - Invalid two-factor auth ticket</i>{/if}
		</div>
		<input bind:value={auth} placeholder="Authentication code" type="tel" />
		<Button onClick={auth_onclick}>Login</Button>
		<Button onClick={() => (page = 0)}>Go Back</Button>
	{/if}
</main>

<style lang="scss">
	@use "../assets/shared" as *;

	main {
		width: 100vw;
		height: 100vh;
		position: absolute;
		top: 0;
		left: 0;

		@extend %layer1;

		padding: 20px 16px;
		padding-bottom: 0;
		overflow: auto;

		:global {
			.Button {
				display: block;
				margin-bottom: 4px;
				padding: 5px 7px;
				width: 100%;
			}
		}
	}

	* {
		font-weight: 500;
		font-size: 16px;
	}

	input {
		height: 40px;
		width: 100%;
		padding: 10px;

		border: 1px solid rgba(114, 114, 114, 0.6);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.6);
		@include linearGradient(35%, hsl(210, 8%, 9.8%));
		background-color: hsl(220, 7.6%, 23.3%);
		border-radius: 5px;

		color: white;
		outline: none;

		line-height: 1;
		margin-bottom: 20px;
		font-weight: 400;
	}

	.red,
	.red > * {
		color: #f38688 !important;
	}

	.separator {
		margin-bottom: 8px;
	}
	.separator,
	.separator > * {
		font-size: 12px;
		color: #b9bbbe;
	}
</style>
