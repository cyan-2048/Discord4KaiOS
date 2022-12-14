import EventTarget from "@ungap/event-target";

export default class EventEmitter extends EventTarget {
	on(type, callback) {
		this.addEventListener(type, callback);
	}
	off(type, callback) {
		this.removeEventListener(type, callback);
	}
	once(type, callback) {
		const self = this;
		self.addEventListener(type, function once() {
			self.removeEventListener(type, once);
			callback.call(self, arguments);
		});
	}
	emit(type, detail) {
		this.dispatchEvent(new CustomEvent(type, { detail }));
	}
}

/**
 * a thing to make binding events easier
 * @param {EventTarget} target
 * @param {String} type
 * @param {Function} callback
 * @param {null | import("svelte/store").Writable} writable
 * @returns {void | import("svelte/store").Unsubscriber}
 */
export function eventHandler(target, type, callback, writable = null) {
	function toggle(value) {
		return target[value ? "addEventListener" : "removeEventListener"](type, callback);
	}

	if (writable === null) {
		toggle(true);
		return () => toggle(false);
	}

	const unsub = writable.subscribe(toggle);

	return function unsubscribe() {
		toggle(false);
		unsub();
	};
}

export function multipleEventHandler(target, keyval, writable = null) {
	function toggle(value) {
		Object.entries(keyval).forEach(([type, callback]) => {
			if (callback) target[value ? "addEventListener" : "removeEventListener"](type, callback);
		});
	}

	if (writable === null) {
		toggle(true);
		return () => toggle(false);
	}

	const unsub = writable.subscribe(toggle);

	return function unsubscribe() {
		toggle(false);
		unsub();
	};
}
