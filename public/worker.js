class DiscordGateway {
	constructor(options) {
		this.token = null;
		this.ws = null;
		this.persist = null;
		this._debug = options && options.debug === true ? true : false;
	}
	// i don't understand why this has to be a get function...
	// i'm just gonna follow it anyways
	get streamURL() {
		return "wss://gateway.discord.gg/?v=9&encoding=json";
	}

	debug() {
		// we use console.info so that we can opt out when debugging
		if (this._debug === true) console.info("[gateway] ", ...arguments);
	}

	login(token) {
		this.token = token;
	}
	send(data) {
		this.debug("send:", data);
		this.ws.send(JSON.stringify(data));
	}
	handlePacket(message) {
		var packet = JSON.parse(message.data);

		this.debug("Handling packet with OP ", packet.op);

		var callbacks = {
			0: this.handlePacketDispatch,
			9: this.handlePacketInvalidSess,
			10: this.handlePacketGatewayHello,
			11: this.handlePacketAck,
		};

		if (packet.op in callbacks) callbacks[packet.op].apply(this, [packet]);
		else this.debug("OP " + packet.op + "not found!");
	}
	handlePacketDispatch(packet) {
		this.persist.sequence_num = packet.s;
		this.debug("dispatch:", packet);
		this.emit("t:" + packet.t.toLowerCase(), packet.d);
	}
	handlePacketInvalidSess(packet) {
		this.debug("sess inv:", packet);
		this.ws.close();
	}

	handlePacketGatewayHello(packet) {
		var self = this,
			ws = this.ws;

		this.debug("Sending initial heartbeat...");
		self.send({
			op: 1, // HEARTBEAT
			d: self.persist.sequence_num || null,
		});

		var interval = setInterval(() => {
			if (ws != self.ws) return clearInterval(interval);
			this.debug("Sending heartbeat...");
			self.send({
				op: 1, // HEARTBEAT
				d: self.persist.sequence_num || null,
			});
		}, packet.d.heartbeat_interval);
		this.debug("heartbeat interval: ", packet.d.heartbeat_interval);
	}

	handlePacketAck(packet) {
		if (this.persist.authenticated) return;

		this.persist.authenticated = true;
		this.send({
			op: 2,
			d: {
				status: "online",
				token: this.token,
				intents: 0b11111111111111111,
				properties: {
					$os: "Android",
					$browser: "Discord Android",
					$device: "phone",
				},
			},
		});
	}

	init() {
		if (!this.token) throw Error("You need to authenticate first!");

		var self = this;

		this.persist = {};

		this.debug("Connecting to gateway...");
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.ws = new WebSocket(this.streamURL);

		this.ws.addEventListener("message", this.handlePacket.bind(this));
		this.ws.addEventListener("open", () => {
			this.debug("Sending Identity [OP 2]...");
		});
		this.ws.addEventListener("close", function (evt) {
			this.ws = null;
			console.error("Discord gateway closed!");
			self.emit("close", evt);
		});
	}
}

let gateway;

self.onmessage = (e) => {
	let { event, token, object } = e.data;
	if (event == "init") {
		if (typeof gateway == "object" && gateway.ws) gateway.ws.close();
		gateway = new DiscordGateway({ debug: true });
		gateway.login(token);
		gateway.emit = function (e, ...args) {
			let event = String(e);
			try {
				args = JSON.parse(JSON.stringify(args));
				self.postMessage({ event, args });
			} catch (e) {}
		};
		gateway.init();
	} else if (event === "send") {
		gateway.send(object);
	}
};
