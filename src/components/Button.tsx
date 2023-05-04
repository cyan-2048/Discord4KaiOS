import { delayedCallback, shallowCompare } from "@utils";

import style from "./Button.module.scss";

import { createSignal, splitProps } from "solid-js";
import type { JSX } from "solid-js";

export interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "onError"> {
	onError?: (err: any) => any;
	onSuccess?: (result: any) => any;
	onClick?: (...args: any[]) => any;
}

export const DeleteSymbol = Symbol("delete");

export default function Button(props: ButtonProps) {
	const [, __props] = splitProps(props, ["onError", "onSuccess", "onClick", "children", "class"]);
	const [state, setState] = createSignal<boolean | null>(false);

	return (
		<button
			class={`${style.Button}${props.class ? " " + props.class : ""}`}
			tabIndex={0}
			data-focusable=""
			{...__props}
			onClick={async (...args) => {
				if (state() === true) return;

				const cancel = delayedCallback(() => setState(true));

				let result: any;
				try {
					result = await props.onClick?.apply(undefined, args);
					props.onSuccess?.(result);
				} catch (e) {
					console.error(e);
					props.onError?.(e);
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
