import { bindedMemoryState, useMount, sleep, toggleCursor, useInputValue, useMemoryState } from "@lib/utils";
import Button, { DeleteSymbol } from "@components/Button";
import { ComponentProps, Fragment, h } from "preact";
import { route } from "preact-router";
import { useRef, useState } from "preact/hooks";
import "./style.scss";

const symbol0 = Symbol(),
	symbol1 = Symbol(),
	symbol2 = Symbol(),
	symbol3 = Symbol(),
	symbol4 = Symbol(),
	symbol5 = Symbol(),
	symbol6 = Symbol(),
	symbol7 = Symbol(),
	symbol8 = Symbol(),
	symbol9 = Symbol(),
	symbol10 = Symbol();

const RequiredField = () => (
	<>
		{" - "}
		<i>This field is required</i>
	</>
);

interface SeparatorProps extends ComponentProps<"div"> {
	required?: true | null;
}

function Separator({ children, required, ...props }: SeparatorProps) {
	return (
		<div class="separator" style={{ color: required && "red" }} {...props}>
			{children}
			{required && <RequiredField />}
		</div>
	);
}

interface HomeState {
	[key: string]: true | null;
}

interface LoginPagesProps {
	setPage: (page: number) => void;
}

function Home({ setPage }: LoginPagesProps) {
	const emailEl = useRef<HTMLInputElement>(null);
	const passwordEl = useRef<HTMLInputElement>(null);

	const [valueStates, setState] = useState({
		email: null,
		password: null,
	} as HomeState);

	const [emailValue, setEmail] = useInputValue(emailEl, bindedMemoryState(symbol0));
	const [passwordValue, setPassword] = useInputValue(passwordEl, bindedMemoryState(symbol2));

	return (
		<>
			<Separator required={valueStates.email}>EMAIL OR PHONE NUMBER</Separator>
			<input ref={emailEl} type="text" />
			<Separator required={valueStates.password}>PASSWORD</Separator>
			<input ref={passwordEl} type="password" />
			<Button
				onClick={async () => {
					const emLen = emailValue.length,
						pwLen = passwordValue.length;
					setState({
						email: !emLen || null,
						password: !pwLen || null,
					});
					if (!emLen || !pwLen) return;
					await sleep(1000); // simulate
					route("/test");
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

function Token({ setPage }: LoginPagesProps) {
	const tokenEl = useRef<HTMLInputElement>(null);

	const [tokenValue, setToken] = useInputValue(tokenEl, bindedMemoryState(symbol3));
	const [tokenState, setTokenState] = useState<null | true>(null);

	return (
		<>
			<Separator required={tokenState}>TOKEN</Separator>
			<input type="password" ref={tokenEl} />
			<Button
				onClick={async () => {
					const len = tokenValue.length;
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

export default function Login({ stuff, ...props }: any) {
	const [page, setPage] = useMemoryState(symbol1, 0);

	useMount(() => {
		toggleCursor(true);
		return () => void toggleCursor(false);
	});

	function pageChange(val: number) {
		return () => setPage(val);
	}

	return (
		<main class="Login">
			{page === 0 && <Home setPage={setPage}></Home>}
			{page === 1 && <Token setPage={setPage}></Token>}
			{page === 2 && <div>Page 3</div>}
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
