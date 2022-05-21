((exports) => {
	// cheap EventEmitter
	class EventEmitter {
		constructor() {
			this._events = [];
		}
		on(name, callback, id = null, once = false) {
			if (id !== null) {
				let ix = this._events.findIndex((a) => a.name === name && a.id === id);
				if (ix > -1) {
					this._events[ix] = { name, callback, id, once };
				} else {
					this._events.push({ name, callback, id, once });
				}
			} else {
				this._events.push({ name, callback, once });
			}
		}

		once(name, callback, id = null) {
			return this.on(name, callback, id, true);
		}

		off(name, callback, id = null) {
			if (id !== null) {
				let ix = this._events.findIndex((a) => a.name === name && a.id === id);
				if (ix > -1) {
					this._events.splice(ix, 1);
				}
			} else {
				let ix = this._events.findIndex((a) => a.name === name && a.callback === callback);
				if (ix > -1) {
					this._events.splice(ix, 1);
				}
			}
		}

		emit() {
			let args = [...arguments];
			let name = args.shift();
			if (name)
				this._events.forEach((a) => {
					if (a.once) {
						this.off(a.name, a.callback, a.id || null);
					}
					if (a.name === name) {
						a.callback.apply(this, args);
					}
				});
		}
	}
	exports.EventEmitter = EventEmitter;
})(typeof exports === "undefined" ? this : exports);
