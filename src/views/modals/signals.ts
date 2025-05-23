import Deferred from "discord/src/lib/Deffered";
import { createSignal } from "solid-js";

interface ToastOptions {
	text: string;
	duration: number;
	promise: Deferred<true>;
}

export const [toastQueue, setToastQueue] = createSignal<ToastOptions[]>([]);
