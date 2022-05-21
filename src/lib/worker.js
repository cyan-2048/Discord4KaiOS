function EventEmitter() {}

importScripts("./DiscordGateway.js");

let gateway;

self.onmessage = (e) => {
	let { event, token } = e.data;
	if (event == "init") {
		if (typeof gateway == "object" && gateway.ws) gateway.ws.close();
		gateway = new DiscordGateway({ debug: true });
		gateway.login(token);
		gateway.emit = (e, d) => {
			let event = String(e);
			let data;
			try {
				data = JSON.parse(JSON.stringify(d));
				self.postMessage({ event, data });
			} catch (e) {}
		};
		gateway.init();
	}
};
