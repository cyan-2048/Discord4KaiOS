import { ComponentProps, splitProps } from "solid-js";
import * as styles from "./Button.module.scss";

export default function Button(
	props: ComponentProps<"div"> & {
		focused?: boolean;
		disabled?: boolean;
	}
) {
	const [, _props] = splitProps(props, ["focused", "disabled", "classList"]);

	return (
		<div
			{..._props}
			classList={{
				...props.classList,
				[styles.button]: true,
				[styles.focused]: props.focused,
				[styles.disabled]: props.disabled,
			}}
		/>
	);
}
