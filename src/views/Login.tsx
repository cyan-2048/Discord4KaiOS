import * as styles from "./Login.module.scss";
import { centerScroll, useKeypress, createRef, sleep } from "@/lib/utils";
import { login } from "./Loading";
import { ResponseError } from "discord/src/DiscordRequest";
import { createSignal, untrack, ComponentProps, onMount, splitProps, onCleanup, Show } from "solid-js";
import SpatialNavigation from "@/lib/spatial_navigation";
import { InvalidTokenError } from "discord";
import Button from "./components/Button";
import { QRCode } from "@/lib/qrCode";

const WELCOME_BACK_QUOTES = [
	"We're so exited to see you again!",
	"It’s never too late to come back to my side.",
	"And I knew you’d come back to me.",
	"You’ll come back each time you leave.",
	"I knew you were trouble when you walked in.",
];

const emailRef = createRef("");
const passwordRef = createRef("");
const tokenRef = createRef("");

function onRefInput(ref: { current: string }, e: InputEvent) {
	ref.current = (e.target as HTMLInputElement).value;
}

const onInput_email = onRefInput.bind(null, emailRef);
const onInput_password = onRefInput.bind(null, passwordRef);
const onInput_token = onRefInput.bind(null, tokenRef);

function FocusableButton(props: ComponentProps<"div"> & { onClick?: () => void; onBack?: () => void }) {
	const [focused, setFocused] = createSignal(false);

	useKeypress(["Enter", "Backspace"], (e) => {
		if (untrack(focused)) {
			if (e.key === "Enter") props.onClick?.();
			else {
				if (props.onBack) props.onBack();
				else window.close();
			}
		}
	});

	return (
		<div
			tabIndex={-1}
			onFocus={(e) => {
				setFocused(true);
				centerScroll(e.currentTarget);
			}}
			onBlur={() => {
				setFocused(false);
			}}
			classList={{
				focusable: true,

				// [styles.button]: true
			}}
		>
			<Button {...props} focused={focused()} />
		</div>
	);
}

function FocusableInput(
	props: Omit<ComponentProps<"input">, "onFocus" | "value"> & {
		onFocus?: () => void;
		value?: string;
		onBack?: () => void;
	}
) {
	const [, _props] = splitProps(props, ["onFocus", "value"]);

	let inputEl: HTMLInputElement | undefined;
	onMount(() => {
		props.value && (inputEl!.value = props.value);
	});

	return (
		<div class={styles.focusableInput}>
			<input
				{..._props}
				on:sn-enter-down={() => {
					SpatialNavigation.move("down");
				}}
				onFocus={() => {
					centerScroll(inputEl!);
				}}
				oncapture:keydown={(e) => {
					if (e.key.includes("Arrow") && (e.key.includes("Left") || e.key.includes("Right"))) {
						e.stopImmediatePropagation();
						e.stopPropagation();
					}
					if (e.key === "Backspace" && e.currentTarget.value == "") {
						if (props.onBack) props.onBack();
						else window.close();
					}
				}}
				class="focusable"
				ref={inputEl}
			/>
		</div>
	);
}

export default function Login(props: { onError: () => void; onLogin: () => void }) {
	const id = "Login";

	onMount(() => {
		SpatialNavigation.add(id, {
			selector: `.${styles.login} .focusable`,
			restrict: "self-only",
		});

		SpatialNavigation.focus(id);
	});

	onCleanup(() => {
		SpatialNavigation.remove(id);
	});

	const [emailRequired, setEmailRequired] = createSignal(false);
	const [passwordRequired, setPasswordRequired] = createSignal(false);

	const [backgroundImage, setBackgroundImage] = createSignal(Math.floor(Math.random() * 6 + 1));

	const interval = setInterval(() => {
		const getInt = () => Math.floor(Math.random() * 6) + 1;

		setBackgroundImage((e) => {
			let newInt = getInt();
			if (newInt != e) return newInt;
			while (newInt == e) newInt = getInt();
			return newInt;
		});
	}, 13 * 1000);

	onCleanup(() => clearInterval(interval));

	const [tokenLogin, setTokenLogin] = createSignal(false);

	async function onLogin() {
		let email = emailRef.current;
		let password = passwordRef.current;
		let token = tokenRef.current;

		if (!token && untrack(tokenLogin)) setTokenLogin(false);

		if (token) {
			email = password = "";
		} else {
			token = "";
			if (!email) {
				setEmailRequired(true);
			}
			if (!password) {
				setPasswordRequired(true);
			}
			if (!email || !password) {
				return;
			}
		}

		try {
			props.onLogin();
			const mfa = await login(email, password, token);
			if (mfa) {
				const mfa_code = prompt("Enter your 2FA code");
				if (mfa_code) {
					mfa.auth(mfa_code).catch(() => {
						alert("Invalid 2FA code");
						props.onError();
					});
				} else {
					props.onError();
				}
			}
		} catch (error) {
			console.error("ERROR LOGIN OCCURED", error);
			const err = error as any;

			if (err instanceof InvalidTokenError) {
				alert("Invalid token");
			}

			if (err instanceof ResponseError) {
				console.log("loginError", err.xhr.response, err.statusCode, err.errors);
				alert(
					`Login Error (Response Error)\nstatusCode: ${err.statusCode}\nmessage: ${
						err.message
					}\nerrors: ${JSON.stringify(err.xhr.response?.errors)}`
				);
			}

			props.onError();
		}
	}

	return (
		<>
			<div
				style={`background-image:url(/backgrounds/image${backgroundImage()}.png)`}
				class={styles.backdrop}
			></div>
			<div class={styles.login}>
				<div class={styles.content}>
					<div class={styles.title}>👋Welcome back!</div>
					<div class={styles.greet}>
						{WELCOME_BACK_QUOTES[Math.floor(Math.random() * WELCOME_BACK_QUOTES.length)]}
					</div>
					<Show when={!tokenLogin()}>
						<div classList={{ [styles.label]: true, [styles.red]: emailRequired() }}>
							EMAIL OR PHONE NUMBER
							<span class={styles.red}>
								<Show when={emailRequired()} fallback={<span class={styles.padding}>*</span>}>
									<em>
										<span class={styles.padding}>-</span>This field is required.
									</em>
								</Show>
							</span>
						</div>
						<FocusableInput
							value={emailRef.current}
							onInput={[
								(e, evt) => {
									e(evt);
									if (emailRequired()) {
										setEmailRequired(false);
									}
								},
								onInput_email,
							]}
						/>
						<div classList={{ [styles.label]: true, [styles.red]: passwordRequired() }}>
							PASSWORD
							<span class={styles.red}>
								<Show when={passwordRequired()} fallback={<span class={styles.padding}>*</span>}>
									<em>
										<span class={styles.padding}>-</span>This field is required.
									</em>
								</Show>
							</span>
						</div>
						<FocusableInput
							value={passwordRef.current}
							autocomplete="off"
							onInput={[
								(e, evt) => {
									e(evt);
									if (passwordRequired()) {
										setPasswordRequired(false);
									}
								},
								onInput_password,
							]}
							type="password"
						/>
					</Show>
					<Show when={tokenLogin()}>
						<div class={styles.label}>TOKEN</div>
						<FocusableInput
							onBack={async () => {
								if (untrack(tokenLogin)) {
									setTokenLogin(false);
									await sleep(0);
									SpatialNavigation.focus(id);
								}
							}}
							onInput={onInput_token}
						/>
					</Show>
					<FocusableButton
						style={{
							"margin-top": "20px",
						}}
						onClick={onLogin}
						onBack={async () => {
							if (untrack(tokenLogin)) {
								setTokenLogin(false);
								await sleep(0);
								SpatialNavigation.focus(id);
							} else window.close();
						}}
					>
						Login
					</FocusableButton>
					<Show
						when={!tokenLogin()}
						fallback={
							<>
								<FocusableButton
									style={{
										"margin-top": "4px",
									}}
									onClick={async () => {
										const qr = new QRCode();
										const actEl = document.activeElement as HTMLElement;
										actEl?.blur();

										try {
											const text = await qr.readAsText();
											if (text) {
												tokenRef.current = text;
												onLogin();
											}
										} catch {
											qr.hideViewer();
										}
										actEl.focus();
									}}
									onBack={async () => {
										if (untrack(tokenLogin)) {
											setTokenLogin(false);
											await sleep(0);
											SpatialNavigation.focus(id);
										}
									}}
								>
									Scan QR that contains token
								</FocusableButton>
								<FocusableButton
									style={{
										"margin-top": "4px",
									}}
									onClick={async () => {
										if (untrack(tokenLogin)) {
											setTokenLogin(false);
											await sleep(0);
											SpatialNavigation.focus(id);
										}
									}}
									onBack={async () => {
										if (untrack(tokenLogin)) {
											setTokenLogin(false);
											await sleep(0);
											SpatialNavigation.focus(id);
										}
									}}
								>
									Go Back
								</FocusableButton>
							</>
						}
					>
						<FocusableButton
							style={{
								"margin-top": "4px",
							}}
							onClick={async () => {
								emailRef.current = "";
								passwordRef.current = "";
								setTokenLogin(true);
								await sleep(0);
								SpatialNavigation.focus(id);
							}}
						>
							Login with Token
						</FocusableButton>
					</Show>
				</div>
			</div>
		</>
	);
}
