import { EventEmitter } from "./EventEmitter.js";

class TypingObject {
	constructor(id, emitter) {
		this.id = id;
		this.emitter = emitter;
	}
	state = [];
	timeouts = {};
	add(userID) {
		clearTimeout(this.timeouts[userID]);
		if (!this.state.includes(userID)) {
			this.state = [userID, ...this.state];
			this.emitter(this.state);
		}
		this.timeouts[userID] = setTimeout(() => {
			this.state = this.state.filter((a) => a !== userID);
			this.emitter(this.state);
		}, 9000);
	}
}

// class which handles typing indicators
export default class TypingState extends EventEmitter {
	constructor() {
		super();
	}
	active = [];
	createState(id) {
		return new TypingObject(id, (state) => {
			this.emit("change", { id, state });
		});
	}
	add(event) {
		const already = this.active.find((a) => a.id === event.channel_id);
		if (already) return already.add(event.user_id);

		const obj = this.createState(event.channel_id);
		obj.add(event.user_id);
		this.active.push(obj);
	}
	getState(channelId) {
		const already = this.active.find((a) => a.id === channelId);
		if (already) return already;

		const obj = this.createState(channelId);
		this.active.push(obj);
		return obj;
	}
}
