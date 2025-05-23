import { MFA, DiscordClient, DiscordClientReady, InvalidTokenError } from "discord";
import localforage from "localforage";
import { discordSetup, setDiscordClient, setDiscordClientReady, setStatusbarColor } from "../signals";
import Login from "./Login";

import * as styles from "./Loading.module.scss";
import { waitForVisibility, createRef, useKeypress } from "@/lib/utils";
import { Match, Switch, createSignal, onMount, onCleanup } from "solid-js";

interface LoadingProps {}

const enum LoadingState {
	Loading,
	LoginRequired,
}

/**
 * this function should be in the very end of the function, this is because it returns a never ending promise
 * the  promise only ends when the gateway closes
 */
export async function login(email: string, password: string, token: string): Promise<MFA | undefined> {
	const result = await (token ? discordSetup.login({ token }) : discordSetup.login({ email, password }));

	console.log("RESSULTTT DIDN'T THROW");

	async function factory(_result: DiscordClient, cb?: (client: DiscordClientReady) => void) {
		setDiscordClient(_result);

		const client = await _result.getClient();

		localStorage.setItem("read_states", JSON.stringify(client.ready.read_state.entries));
		await localforage.setItem("token", _result.config.token);

		cb?.(client);

		// console.log("clientReady", client);
		setDiscordClientReady(client);
	}

	if (result instanceof MFA) {
		result.on("auth", factory);
		return result;
	}

	return new Promise((resolve, reject) => {
		let rejectOnClose = true;

		result.once("close", () => {
			rejectOnClose && reject();
		});

		factory(result, () => {
			rejectOnClose = false;
			resolve(undefined);
		});
	});
}

function LoadingScreen() {
	isInLoadingScreen.current = true;
	setStatusbarColor("rgb(0,0,0)");

	onCleanup(() => {
		isInLoadingScreen.current = false;
	});

	useKeypress("Backspace", () => {
		window.close();
	});

	return (
		<div
			style={{
				height: window.outerHeight ? window.outerHeight + "px" : undefined,
			}}
			class={styles.loading}
		>
			<svg class={styles.progressRing} height={24} width={24} viewBox="0 0 16 16">
				<circle cx="8px" cy="8px" r="7px"></circle>
			</svg>
		</div>
	);
}

export const isInLoadingScreen = createRef(false);

export default function Loading(props: LoadingProps) {
	const [state, setState] = createSignal<LoadingState>(LoadingState.Loading);

	let attemptsToLogin = 0;

	onMount(async () => {
		const token = await localforage.getItem<string>("token");

		if (token === null) {
			setState(LoadingState.LoginRequired);
			return;
		}

		await waitForVisibility();

		try {
			await login("", "", token);
		} catch (error) {
			console.error("ERROR LOGIN OCCURED", error);

			if (error instanceof InvalidTokenError) {
			} else {
				while (attemptsToLogin < 5) {
					await waitForVisibility();
					try {
						await login("", "", token);
						return;
					} catch (error) {
						attemptsToLogin++;
						console.error("LOGIN ATTEMPT", attemptsToLogin, error);
					}
				}
			}

			alert("error occured when logging in using stored token, login again");
			setState(LoadingState.LoginRequired);
		}
	});

	return (
		<Switch>
			<Match when={state() === LoadingState.Loading}>
				<LoadingScreen />
			</Match>
			<Match when={state() === LoadingState.LoginRequired}>
				<Login
					onError={() => {
						setState(LoadingState.LoginRequired);
					}}
					onLogin={() => {
						setState(LoadingState.Loading);
					}}
				/>
			</Match>
		</Switch>
	);
}
