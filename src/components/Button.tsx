import { delayedCallback, shallowCompare } from "@utils";

import style from "./Button.module.scss";

import { createSignal } from "solid-js";
import type { JSX } from "solid-js";

interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "onError"> {
	onError?: (err: any) => any;
	onSuccess?: (result: any) => any;
	onClick?: (...args: any[]) => any;
}

export const DeleteSymbol = Symbol("delete");

export default function Button({ onError, onSuccess, onClick, ...props }: ButtonProps) {
	const [state, setState] = createSignal<boolean | null>(false);

	return (
		<button
			class={style.Button}
			tabIndex={0}
			data-focusable=""
			{...props}
			onClick={async (...args) => {
				if (state() === true) return;

				const cancel = delayedCallback(() => setState(true));

				let result: any;
				try {
					result = await onClick?.apply(undefined, args);
					onSuccess?.(result);
				} catch (e) {
					console.error(e);
					onError?.(e);
				}

				cancel();

				if (result === DeleteSymbol) {
					setState(null);
				} else setState(false);
			}}
		>
			{state() ? (
				<div class={style.dotWrap}>
					<div class={style.dotFlashing} />
				</div>
			) : (
				props.children
			)}
		</button>
	);
}
