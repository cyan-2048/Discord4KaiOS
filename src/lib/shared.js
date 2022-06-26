import SpatialNavigation from "./spatial_navigation.js";
import { DiscordXHR } from "./DiscordXHR.js";
import TypingState from "./TypingState.js";
import { EventEmitter } from "./EventEmitter";

export const evtForward = new EventEmitter();
export const serverAck = new EventEmitter();
export const typingState = new TypingState();

export const sn = SpatialNavigation;
sn.init();

["messages", "channels", "servers"].forEach((id) =>
	sn.add({
		id,
		selector: `[data-${id}].selected [data-focusable]`,
		rememberSource: true,
		restrict: "self-only",
	})
);

["message", "image"].forEach((i) =>
	sn.add({
		id: i + "-opts",
		selector: `[data-${i}-options] > *`,
		restrict: "self-only",
	})
);

export const discord = new DiscordXHR({ cache: true });
export const discordGateway = new (class extends EventEmitter {
	constructor() {
		super();
		let worker = new Worker("/worker.js");
		this.worker = worker;
		worker.onmessage = (e) => {
			let { event, args } = e.data;
			this.emit(event, ...args);
		};
	}
	init(token) {
		this.worker.postMessage({ event: "init", token });
	}
	send(object) {
		this.worker.postMessage({ event: "send", object });
	}
})();
