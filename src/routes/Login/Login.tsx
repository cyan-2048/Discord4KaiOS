import { bindedMemoryState, useMount, sleep, toggleCursor, useInputValue, useMemoryState, hash } from "@lib/utils";
import Button, { DeleteSymbol } from "@components/Button";
import { ComponentProps, Fragment, h } from "preact";
import { route } from "preact-router";
import { MutableRef, useMemo, useRef, useState } from "preact/hooks";
import "./style.scss";
import { sn } from "@lib/shared";

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

	const [valueStates, setState] = useState<HomeState>({
		email: null,
		password: null,
	});

	const [emailValue, setEmail] = useInputValue(emailEl, bindedMemoryState(symbol0));
	const [passwordValue, setPassword] = useInputValue(passwordEl, bindedMemoryState(symbol2));

	useFocus(emailEl);

	return (
		<>
			<Separator required={valueStates.email}>EMAIL OR PHONE NUMBER</Separator>
			<input tabIndex={0} ref={emailEl} type="text" />
			<Separator required={valueStates.password}>PASSWORD</Separator>
			<input tabIndex={0} ref={passwordEl} type="password" />
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

	useFocus(tokenEl);

	return (
		<>
			<Separator required={tokenState}>TOKEN</Separator>
			<input tabIndex={0} type="password" ref={tokenEl} />
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

/**
 * this is a custom hook, it will focus a selected element when the component is mounted
 */
function useFocus(ref: MutableRef<HTMLElement>) {
	useMount(() => {
		ref.current?.focus();
	});
}

type MFAuthState = false | SeparatorProps["required"];

function MFAuth({ setPage }: LoginPagesProps) {
	const codeEl = useRef<HTMLInputElement>(null);

	const [auth, setCode] = useInputValue(codeEl);
	const [required, setRequired] = useState<MFAuthState>(null);

	const label = "ENTER DISCORD AUTH/BACKUP CODE";

	useFocus(codeEl);

	return (
		<>
			<Separator required={required || null}>
				{label}
				{required === false ? <i> - Invalid two-factor auth ticket</i> : null}
			</Separator>
			<input tabIndex={0} ref={codeEl} placeholder="Authentication code" type="tel" />
			<Button
				onClick={async () => {
					const len = auth.length;
					if (auth === "") setRequired(true);
					else if (isNaN(Number(auth)) || len < 0 || len > 8) {
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

const sectionID = hash(Math.random().toString().slice(3));

export default function Login(props: any) {
	const [page, setPage] = useMemoryState(symbol1, 0);

	useMount(() => {
		sn.add(sectionID, {
			selector: ".Login [tabindex]",
			restrict: "self-only",
		});

		return () => sn.remove(sectionID);
	});

	return (
		<main class="Login">
			{page === 0 && <Home setPage={setPage}></Home>}
			{page === 1 && <Token setPage={setPage}></Token>}
			{page === 2 && <MFAuth setPage={setPage}></MFAuth>}
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
