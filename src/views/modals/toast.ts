import Deferred from "discord/src/lib/Deffered";
import { setToastQueue } from "./signals";

export function toast(message: string, duration: number = 3000) {
	const deferred = new Deferred<true>();
	setToastQueue((e) => [...e, { text: message, duration, promise: deferred }]);
	return deferred.promise;
}

export * from "./Toast.tsx";