import SpatialNavigation from "./spatial_navigation.cjs";
import { DiscordXHR } from "./DiscordXHR.js";
import TypingState from "./TypingState.js";
import { EventEmitter } from "./EventEmitter";

export const evtForward = new EventEmitter();
export const serverAck = new EventEmitter();
export const typingState = new TypingState();

export const sn = SpatialNavigation;

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
