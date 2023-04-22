import { delayedCallback } from "@utils";
import { h, Fragment } from "preact";
import { forwardRef, HTMLAttributes, memo, useState } from "preact/compat";
import "./assets/button.scss";

interface ButtonProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onClick" | "onError"> {
	onError?: (err: any) => any;
	onSuccess?: (result: any) => any;
	onClick?: (...args: any[]) => any;
}

export const DeleteSymbol = Symbol("delete");

export default memo(function Button({ onClick, onError, onSuccess, ...props }: ButtonProps, forwardTheRef) {
	const [state, setState] = useState(false);

	async function changeOfState(...args: any[]) {
		if (state) return;

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
	}

	return state === null ? (
		<></>
	) : (
		<button class="Button" tabIndex={0} data-focusable="" {...props} onClick={changeOfState} ref={forwardTheRef}>
			{state ? (
				<div class="dot-wrap">
					<div class="dot-flashing" />
				</div>
			) : (
				props.children
			)}
		</button>
	);
});
