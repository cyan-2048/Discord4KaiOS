import { sleep, hash } from "@utils";
import { inputValue, useMount, useSpatialNav } from "@hooks";

/*#__PURE__*/ inputValue(null);

import { default as _Button, ButtonProps } from "@components/Button";

function Button(props: ButtonProps) {
	return <_Button {...props} class={`${style.Button}`} />;
}

import { ComponentProps, JSX, Match, Switch, createSignal, onMount, splitProps } from "solid-js";

import style from "./Login.module.scss";
import { discordInstance, loadDiscord, setToken } from "@shared";
import MFA from "discord/MFA";
import { useNavigate } from "@solidjs/router";

const RequiredField = () => (
	<>
		{" - "}
		<i>This field is required</i>
	</>
);

async function testToken(authorization: string) {
	const settings = await discordInstance().xhr("users/@me", { method: "get", headers: { authorization } });
	if (settings.code === 0) throw settings;
	return settings;
}

interface SeparatorProps extends ComponentProps<"div"> {
	required?: true | null;
}

function Separator(props: SeparatorProps) {
	const [, __props] = splitProps(props, ["children", "required"]);
	return (
		<div class={style.separator} style={{ color: props.required && "red" }} {...__props}>
			{props.children}
			{props.required && <RequiredField />}
		</div>
	);
}

interface HomeState {
	[key: string]: true | null;
}

interface LoginPagesProps {
	setPage: (page: number) => void;
}

const [emailValue, setEmail] = createSignal("");
const [passwordValue, setPassword] = createSignal("");

function Home() {
	const [valueStates, setState] = createSignal<HomeState>({
		email: null,
		password: null,
	});

	return (
		<>
			<Separator required={valueStates().email}>EMAIL OR PHONE NUMBER</Separator>
			<input use:focusElement tabIndex={0} use:inputValue={[emailValue, setEmail]} type="text" />
			<Separator required={valueStates().password}>PASSWORD</Separator>
			<input tabIndex={0} use:inputValue={[passwordValue, setPassword]} type="password" />
			<Button
				onClick={async () => {
					const emLen = emailValue().length,
						pwLen = passwordValue().length;
					setState({
						email: !emLen || null,
						password: !pwLen || null,
					});
					if (!emLen || !pwLen) return;

					const discord = discordInstance();

					try {
						const res = await discord.signin(emailValue(), passwordValue());
						if (res instanceof MFA) {
						} else {
							setToken(res);
							loadDiscord();
						}
					} catch (e) {
						alert(e);
					}
				}}
			>
				Login
			</Button>
			<Button onClick={() => setPage(1)}>Login with Token</Button>
		</>
	);
}

function todo() {
	console.log("TODO");
}

const [tokenValue, _setToken] = createSignal("");
function Token() {
	const [tokenState, setTokenState] = createSignal<null | true>(null);

	const route = useNavigate();

	return (
		<>
			<Separator required={tokenState()}>TOKEN</Separator>
			<input use:focusElement tabIndex={0} type="password" use:inputValue={[tokenValue, _setToken]} />
			<Button
				onClick={async () => {
					const len = tokenValue().length;
					setTokenState(!len || null);
					if (!len) return;
					await sleep(1000); // simulate
					route("/test");
				}}
			>
				Login
			</Button>
			<Button onClick={todo}>Use token.txt file</Button>
			<Button onClick={todo}>Scan QR that contains token</Button>
			<Button onClick={() => setPage(0)}>Go Back</Button>
		</>
	);
}

/**
 * this is a custom "directive", it will focus a selected element when the component is mounted
 */
function focusElement(el: HTMLElement) {
	onMount(() => {
		el.focus();
	});
}

type MFAuthState = false | SeparatorProps["required"];

function MFAuth() {
	const [auth, setCode] = createSignal("");
	const [required, setRequired] = createSignal<MFAuthState>(null);

	const label = "ENTER DISCORD AUTH/BACKUP CODE";

	return (
		<>
			<Separator required={required() || null}>
				{label}
				{required() === false ? <i> - Invalid two-factor auth ticket</i> : null}
			</Separator>
			<input tabIndex={0} use:inputValue={[auth, setCode]} placeholder="Authentication code" type="tel" />
			<Button
				onClick={async () => {
					const len = auth().length;
					if (auth() === "") setRequired(true);
					else if (isNaN(Number(auth())) || len < 0 || len > 8) {
						setRequired(false);
					} else {
						setRequired(null);
					}
				}}
			>
				Login
			</Button>
			<Button onClick={() => setPage(0)}>Go Back</Button>
		</>
	);
}

const sectionID = hash(Math.random().toString());

const [page, setPage] = createSignal(0);

export default function Login(props: any) {
	useSpatialNav({
		selector: `.${style.Login} [tabindex]`,
		restrict: "self-only",
		id: sectionID,
	});

	return (
		<main class={style.Login}>
			<Switch>
				<Match when={page() === 0}>
					<Home />
				</Match>
				<Match when={page() === 1}>
					<Token />
				</Match>
				<Match when={page() === 2}>
					<MFAuth />
				</Match>
			</Switch>
		</main>
	);
	/* <Button onClick={pageChange(0)}>1</Button>
			<Button onClick={pageChange(1)}>2</Button>
			<Button onClick={pageChange(2)}>3</Button>
			<Button
				onClick={() => {
					route("/test");
				}}
			>
				Test Route
			</Button> */
}
