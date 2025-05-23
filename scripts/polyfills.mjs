// import { mapStackTrace } from "sourcemapped-stacktrace";

/**
 * this file contains the polyfills that will be loaded before anything else
 * - WARNING: the code will also be executed in workers, be cautious in adding polyfills
 *
 * @type {Window & typeof globalThis}
 */
const s = self;
s.globalThis = s;

const IS_WORKER = typeof importScripts != "undefined";

const workerSuffix = IS_WORKER ? " (worker)" : "";
console.time("polyfills" + workerSuffix);

try {
	s.window = s;
} catch {}

const NativeWorker = self.Worker;
class Worker extends NativeWorker {
	constructor(url) {
		// all workers are iife!!!
		super(url);
	}
}

Worker.native = NativeWorker;
self.Worker = Worker;

const NativeXMLHttpRequest = self.XMLHttpRequest;

class XMLHttpRequest extends NativeXMLHttpRequest {
	constructor() {
		// @ts-ignore
		super({ mozSystem: true, mozAnon: true });
	}
}

XMLHttpRequest.native = NativeXMLHttpRequest;
self.XMLHttpRequest = XMLHttpRequest;

// Lesson learned: take polyfills from the actual proposal instead of random code you find online
// https://github.com/tc39/proposal-object-getownpropertydescriptors
if (!Object.hasOwnProperty("getOwnPropertyDescriptors")) {
	Object.defineProperty(Object, "getOwnPropertyDescriptors", {
		configurable: true,
		writable: true,
		value: function getOwnPropertyDescriptors(object) {
			return Reflect.ownKeys(object).reduce((descriptors, key) => {
				return Object.defineProperty(descriptors, key, {
					configurable: true,
					enumerable: true,
					writable: true,
					value: Object.getOwnPropertyDescriptor(object, key),
				});
			}, {});
		},
	});
}

if (import.meta.env.KAIOS != 3) {
	String.prototype.trimEnd ||= String.prototype.trimRight;

	if (typeof self.queueMicrotask !== "function") {
		self.queueMicrotask = function (callback) {
			Promise.resolve()
				.then(callback)
				.catch((e) =>
					setTimeout(() => {
						throw e;
					})
				);
		};
	}

	if (self.Blob) {
		const blob = Blob.prototype;

		if (!blob.arrayBuffer) {
			blob.arrayBuffer = function () {
				return new Response(this).arrayBuffer();
			};
		}
	}

	// const origPostMessage = self.postMessage;

	// self.postMessage = function () {
	// 	let tries = 0;

	// 	try {
	// 		origPostMessage.apply(this, arguments);
	// 	} catch (e) {
	// 		// console.error("Error while calling postMessage", e, ...arguments);

	// 		(async () => {
	// 			while (tries < 5) {
	// 				await new Promise((res) => setTimeout(res, 0));
	// 				tries++;

	// 				// console.log("postMessage attempt", tries);

	// 				if (tries > 2) {
	// 					try {
	// 						const args = [...arguments];

	// 						// console.log("postMessage attempt", tries, "trying JSON.parse");
	// 						args[0] = JSON.parse(JSON.stringify(arguments[0]));

	// 						origPostMessage.apply(this, args);
	// 						break;
	// 					} catch (e) {
	// 						continue;
	// 					}
	// 				}

	// 				try {
	// 					origPostMessage.apply(this, arguments);
	// 					break;
	// 				} catch {}
	// 			}
	// 		})();
	// 	}
	// };

	if (!Promise.prototype.finally) {
		Promise.prototype.finally = function (callback) {
			if (typeof callback !== "function") {
				return this.then(callback, callback);
			}
			const P = this.constructor || Promise;
			return this.then(
				(value) => P.resolve(callback()).then(() => value),
				(err) =>
					P.resolve(callback()).then(() => {
						throw err;
					})
			);
		};
	}

	// so we can catch errors like SyntaxError
	s.onerror = (...args) => {
		// const reason = args[4];
		console.error(...args);

		// if (typeof reason == "object" && "stack" in reason) {
		// 	mapStackTrace(reason.stack, (stack) => {
		// 		console.error("MAPPED:", stack);
		// 	});
		// }

		// if (reason) {
		// 	if ("__reportError__" in self && typeof self.__reportError__ === "function") {
		// 		self.__reportError__(reason);
		// 	}
		// }
	};

	if (!IS_WORKER) {
		(function (supported) {
			if (supported) return;
			function get() {
				return document.contains(this);
			}
			Object.defineProperty(Node.prototype, "isConnected", { get });
		})("isConnected" in Node.prototype);

		// Source: https://gitlab.com/ollycross/element-polyfill
		(function (arr) {
			function docFragger(args) {
				const docFrag = document.createDocumentFragment();

				args.forEach((argItem) =>
					docFrag.appendChild(argItem instanceof Node ? argItem : document.createTextNode(String(argItem)))
				);

				return docFrag;
			}

			const { defineProperty } = Object;

			function define(item, name, value) {
				defineProperty(item, name, { configurable: true, enumerable: true, writable: true, value });
			}

			arr.forEach(function (item) {
				if (!item) return;
				if (!item.hasOwnProperty("append")) {
					define(item, "append", function append(...args) {
						this.appendChild(docFragger(args));
					});
				}
				if (!item.hasOwnProperty("prepend")) {
					define(item, "prepend", function prepend(...args) {
						this.insertBefore(docFragger(args), this.firstChild);
					});
				}
				if (!item.hasOwnProperty("after")) {
					define(item, "after", function after(...argArr) {
						var docFrag = document.createDocumentFragment();

						argArr.forEach(function (argItem) {
							docFrag.appendChild(argItem instanceof Node ? argItem : document.createTextNode(String(argItem)));
						});

						this.parentNode.insertBefore(docFrag, this.nextSibling);
					});
				}
			});
		})([Element.prototype, Document.prototype, DocumentFragment.prototype]);
	}

	if (!IS_WORKER) NodeList.prototype.forEach ||= Array.prototype.forEach;
}

import "systemjs/dist/s.js";
import "systemjs/dist/extras/amd.js";

import "core-js/actual/array/flat";
import "core-js/actual/array/at";
import "core-js/actual/array/flat-map";
import "core-js/actual/array/find-last";
import "core-js/actual/array/to-sorted";
import "core-js/actual/string/match-all";
import "core-js/actual/string/replace-all";
import "core-js/actual/set-immediate";
import "core-js/actual/clear-immediate";
import "core-js/actual/url";
import "core-js/actual/url-search-params";
import "core-js/actual/object/from-entries";

console.timeEnd("polyfills" + workerSuffix);
