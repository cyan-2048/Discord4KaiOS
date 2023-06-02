import { delayedCallback, shallowCompare } from "@utils";
import { h, Component } from "preact";
import { HTMLAttributes } from "preact/compat";
import styles from "./Button.module.scss";

interface ButtonProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onClick" | "onError"> {
	onError?: (err: any) => any;
	onSuccess?: (result: any) => any;
	onClick?: (...args: any[]) => any;
}

export const DeleteSymbol = Symbol("delete");

export default class Button extends Component<ButtonProps, { _: boolean | null }> {
	state = { _: false };

	changeOfState = async (...args: any[]) => {
		const { onSuccess, onError, onClick } = this.props;
		const setState = (e: boolean | null) => this.setState({ _: e });

		if (this.state._) return;

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
	};

	shouldComponentUpdate({ onError, onSuccess, onClick, ...nextProps }, nextState) {
		return shallowCompare(nextProps, this.props) || shallowCompare(nextState, this.state);
	}

	render({ class: _class, ...props }, { _ }) {
		return (
			<button class={`${styles.Button}${_class ? " " + _class : ""}`} tabIndex={0} data-focusable="" {...props} onClick={this.changeOfState}>
				{_ ? (
					<div class={styles["dot-wrap"]}>
						<div class={styles["dot-flashing"]} />
					</div>
				) : (
					props.children
				)}
			</button>
		);
	}
}
