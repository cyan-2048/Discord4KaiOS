import cors_proxy from "cors-anywhere";

// proxy when using dev build
// on kaios we can just use xmlhttpreq with mozSystem
cors_proxy
	.createServer({
		originWhitelist: [], // Allow all origins
		requireHeader: [],
		removeHeaders: [],
	})
	.listen(6969, "127.0.0.1");

// add this code snippet to your app
// if you want to proxy all XHRs
// injecting code to the fetch function is optional,
// kaios doesn't support mozSystem for fetch requests
/*
const proxyURL = (url) => {
	var cors_api_host = "localhost:6969";
	var cors_api_url = "http://" + cors_api_host + "/";
	var origin = window.location.protocol + "//" + window.location.host;
	var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(url);
	if (targetOrigin && targetOrigin[0].toLowerCase() !== origin && targetOrigin[1] !== cors_api_host) {
		return cors_api_url + url;
	}
	return null;
};

(function () {
	const open = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function () {
		const args = [...arguments];
		const proxy = proxyURL(args[1]);
		if (proxy !== null) args[1] = proxy;
		return open.apply(this, args);
	};
})();

(function () {
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () {
    const args = [...arguments];
    const proxy = proxyURL(args[1]);
    if (proxy !== null) args[1] = proxy;
    return open.apply(this, args);
  };
})();

(function (ns, fetch) {
  if (typeof fetch !== "function") return;

  ns.fetch = function (url, ...args) {
    const proxy = proxyURL(url);
    if (proxy !== null) url = proxy;

    var out = fetch.call(this, url, ...args);
    // side-effect
    out.then(({ ok }) => console.log("loaded", ok));

    return out;
  };
})(window, window.fetch);

*/
