import * as styles from "./DateSeparator.module.scss";
import { JSXElement } from "solid-js";

export default function DateSeparator(props: { children: JSXElement }) {
	return (
		<div class={styles.strike}>
			<span>{props.children}</span>
		</div>
	);
}
