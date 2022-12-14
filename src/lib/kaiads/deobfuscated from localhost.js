/**
 * @license

 You may not use this file except in compliance with the KaiAds SDK Agreement.
 You may obtain a copy of the KaiAds SDK Agreement at
 https://www.kaiostech.com/sdk-agreement/
*/
"use strict";
/**
 * @param {!Object} arr
 * @return {?}
 */
function _toConsumableArray(arr) {
	return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
/**
 * @return {?}
 */
function _nonIterableSpread() {
	throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
/**
 * @param {!Object} data
 * @return {?}
 */
function _iterableToArray(data) {
	if ((typeof Symbol !== "undefined" && data[Symbol.iterator] != null) || data["@@iterator"] != null) {
		return Array.from(data);
	}
}
/**
 * @param {!Object} arr
 * @return {?}
 */
function _arrayWithoutHoles(arr) {
	if (Array.isArray(arr)) {
		return _arrayLikeToArray(arr);
	}
}
/**
 * @param {!Object} i
 * @param {number} query
 * @return {?}
 */
function _slicedToArray(i, query) {
	return (
		_arrayWithHoles(i) || _iterableToArrayLimit(i, query) || _unsupportedIterableToArray(i, query) || _nonIterableRest()
	);
}
/**
 * @return {?}
 */
function _nonIterableRest() {
	throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
/**
 * @param {!Object} data
 * @param {number} term
 * @return {?}
 */
function _unsupportedIterableToArray(data, term) {
	if (!data) {
		return;
	}
	if (typeof data === "string") {
		return _arrayLikeToArray(data, term);
	}
	var key = Object.prototype.toString.call(data).slice(8, -1);
	if (key === "Object" && data.constructor) {
		key = data.constructor.name;
	}
	if (key === "Map" || key === "Set") {
		return Array.from(data);
	}
	if (key === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(key)) {
		return _arrayLikeToArray(data, term);
	}
}
/**
 * @param {!Object} array
 * @param {number} value
 * @return {?}
 */
function _arrayLikeToArray(array, value) {
	if (value == null || value > array.length) {
		value = array.length;
	}
	/** @type {number} */
	var i = 0;
	/** @type {!Array} */
	var ret = new Array(value);
	for (; i < value; i++) {
		ret[i] = array[i];
	}
	return ret;
}
/**
 * @param {!Object} data
 * @param {number} selector
 * @return {?}
 */
function _iterableToArrayLimit(data, selector) {
	var options = data == null ? null : (typeof Symbol !== "undefined" && data[Symbol.iterator]) || data["@@iterator"];
	if (options == null) {
		return;
	}
	/** @type {!Array} */
	var PL$79 = [];
	/** @type {boolean} */
	var _0x36ada9 = true;
	/** @type {boolean} */
	var _0x13960b = false;
	var PL$18;
	var interestingPoint;
	try {
		options = options.call(data);
		for (; !(_0x36ada9 = (PL$18 = options.next()).done); _0x36ada9 = true) {
			PL$79.push(PL$18.value);
			if (selector && PL$79.length === selector) {
				break;
			}
		}
	} catch (viewportCenter) {
		/** @type {boolean} */
		_0x13960b = true;
		interestingPoint = viewportCenter;
	} finally {
		try {
			if (!_0x36ada9 && options.return != null) {
				options.return();
			}
		} finally {
			if (_0x13960b) {
				throw interestingPoint;
			}
		}
	}
	return PL$79;
}
/**
 * @param {!Object} data
 * @return {?}
 */
function _arrayWithHoles(data) {
	if (Array.isArray(data)) {
		return data;
	}
}
/**
 * @param {string} call
 * @return {?}
 */
function _typeof(call) {
	"@babel/helpers - typeof";
	return (
		(_typeof =
			"function" == typeof Symbol && "symbol" == typeof Symbol.iterator
				? function (serviceArg) {
						return typeof serviceArg;
				  }
				: function (obj) {
						return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype
							? "symbol"
							: typeof obj;
				  }),
		_typeof(call)
	);
}
/**
 * @param {!Function} obj
 * @param {!Object} props
 * @return {undefined}
 */
function _defineProperties(obj, props) {
	/** @type {number} */
	var i = 0;
	for (; i < props.length; i++) {
		var desc = props[i];
		desc.enumerable = desc.enumerable || false;
		/** @type {boolean} */
		desc.configurable = true;
		if ("value" in desc) {
			/** @type {boolean} */
			desc.writable = true;
		}
		Object.defineProperty(obj, desc.key, desc);
	}
}
/**
 * @param {!Function} obj
 * @param {!Object} properties
 * @param {!Object} attributes
 * @return {?}
 */
function _createClass(obj, properties, attributes) {
	if (properties) {
		_defineProperties(obj.prototype, properties);
	}
	if (attributes) {
		_defineProperties(obj, attributes);
	}
	return (
		Object.defineProperty(obj, "prototype", {
			writable: false,
		}),
		obj
	);
}
/**
 * @param {!AudioNode} instance
 * @param {!Function} Constructor
 * @return {undefined}
 */
function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}
/**
 * @param {!Function} obj
 * @param {!Object} data
 * @return {undefined}
 */
function _inherits(obj, data) {
	if (typeof data !== "function" && data !== null) {
		throw new TypeError("Super expression must either be null or a function");
	}
	obj.prototype = Object.create(data && data.prototype, {
		constructor: {
			value: obj,
			writable: true,
			configurable: true,
		},
	});
	Object.defineProperty(obj, "prototype", {
		writable: false,
	});
	if (data) {
		_setPrototypeOf(obj, data);
	}
}
/**
 * @param {!Function} object
 * @return {?}
 */
function _createSuper(object) {
	var _0x32b530 = _isNativeReflectConstruct();
	return function SuggestList() {
		var proxy = _getPrototypeOf(object);
		var _ret;
		if (_0x32b530) {
			var Constructor = _getPrototypeOf(this).constructor;
			_ret = Reflect.construct(proxy, arguments, Constructor);
		} else {
			_ret = proxy.apply(this, arguments);
		}
		return _possibleConstructorReturn(this, _ret);
	};
}
/**
 * @param {undefined} self
 * @param {string} call
 * @return {?}
 */
function _possibleConstructorReturn(self, call) {
	if (call && (_typeof(call) === "object" || typeof call === "function")) {
		return call;
	} else {
		if (call !== void 0) {
			throw new TypeError("Derived constructors may only return object or undefined");
		}
	}
	return _assertThisInitialized(self);
}
/**
 * @param {number} proplist
 * @return {?}
 */
function _assertThisInitialized(proplist) {
	if (proplist === void 0) {
		throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	}
	return proplist;
}
/**
 * @param {!Function} name
 * @return {?}
 */
function _wrapNativeSuper(name) {
	/** @type {(Map|undefined)} */
	var params = typeof Map === "function" ? new Map() : undefined;
	return (
		(_wrapNativeSuper = function cache(att) {
			/**
			 * @return {?}
			 */
			function fn() {
				return _construct(att, arguments, _getPrototypeOf(this).constructor);
			}
			if (att === null || !_isNativeFunction(att)) {
				return att;
			}
			if (typeof att !== "function") {
				throw new TypeError("Super expression must either be null or a function");
			}
			if (typeof params !== "undefined") {
				if (params.has(att)) {
					return params.get(att);
				}
				params.set(att, fn);
			}
			return (
				(fn.prototype = Object.create(att.prototype, {
					constructor: {
						value: fn,
						enumerable: false,
						writable: true,
						configurable: true,
					},
				})),
				_setPrototypeOf(fn, att)
			);
		}),
		_wrapNativeSuper(name)
	);
}
/**
 * @param {!Function} data
 * @param {!Array} type
 * @param {?} nodeHost
 * @return {?}
 */
function _construct(data, type, nodeHost) {
	return (
		_isNativeReflectConstruct()
			? (_construct = Reflect.construct.bind())
			: (_construct = function embedSWF(attObj, parObj, replaceElemIdStr) {
					/** @type {!Array} */
					var statsDb = [null];
					statsDb.push.apply(statsDb, parObj);
					var statsDbPath = Function.bind.apply(attObj, statsDb);
					var html = new statsDbPath();
					if (replaceElemIdStr) {
						_setPrototypeOf(html, replaceElemIdStr.prototype);
					}
					return html;
			  }),
		_construct.apply(null, arguments)
	);
}
/**
 * @return {?}
 */
function _isNativeReflectConstruct() {
	if (typeof Reflect === "undefined" || !Reflect.construct) {
		return false;
	}
	if (Reflect.construct.sham) {
		return false;
	}
	if (typeof Proxy === "function") {
		return true;
	}
	try {
		return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})), true;
	} catch (_0x378dcf) {
		return false;
	}
}
/**
 * @param {!Function} attObj
 * @return {?}
 */
function _isNativeFunction(attObj) {
	return Function.toString.call(attObj).indexOf("[native code]") !== -1;
}
/**
 * @param {!Function} fn
 * @param {!Function} value
 * @return {?}
 */
function _setPrototypeOf(fn, value) {
	return (
		(_setPrototypeOf = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function getDocumentOffset(elem, value) {
					return (elem.__proto__ = value), elem;
			  }),
		_setPrototypeOf(fn, value)
	);
}
/**
 * @param {!Function} object
 * @return {?}
 */
function _getPrototypeOf(object) {
	return (
		(_getPrototypeOf = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function build(obj) {
					return obj.__proto__ || Object.getPrototypeOf(obj);
			  }),
		_getPrototypeOf(object)
	);
}
var getKaiAd = (function () {
	/**
	 * @param {?} hide
	 * @return {undefined}
	 */
	function createRow(hide) {
		var hideProps = document.createElement("style");
		hideProps.textContent = hide;
		document.head.appendChild(hideProps);
	}
	/**
	 * @return {?}
	 */
	function callback() {
		var results1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.activeElement;
		if (!results1 || !results1.dataset[i]) {
			return;
		}
		var eiFrame = results1.getElementsByTagName("iframe");
		return eiFrame.length > 0 ? eiFrame[0] : null;
	}
	var p3 = "1.5.8";
	var params = {
		DOCBODY_NOT_READY: 1,
		ONREADY_FUNC_MISSING: 2,
		AD_DIMEN_TOO_SMALL: 3,
		AD_IFRAME_GONE: 4,
		AD_REQ_TIMED_OUT: 5,
		SERVER_SAID_NO_AD: 6,
		FREQ_CAPPING: 7,
		MISSING_W_H: 8,
		BAD_SERVER_RESPONSE: 9,
		INVOKE_API_FAILED: 11,
		CANNOT_PROCESS_RESPONSE: 13,
		NO_SERVER_RESPONSE: 14,
		INVALID_TEST_PARAM: 15,
		DISPLAY_CALLED_MULTIPLE_TIMES: 16,
		CANNOT_FETCH_SETTINGS: 17,
		UNKNOWN_API_CALLED: 18,
		SDK_CANNOT_LOAD: 19,
		UNSUPPORTED_SDK_VER: 20,
		BLACKLISTED: 21,
		CERT_STATE_ERR: 22,
	};
	/** @type {number} */
	var rumbleSpeed = 100;
	var RegExp = (function (_WebInspector$DashboardView) {
		/**
		 * @param {?} previouslyUpdatedObjects
		 * @return {?}
		 */
		function SettingsContent(previouslyUpdatedObjects) {
			var updatedMap;
			return (
				_classCallCheck(this, SettingsContent),
				(updatedMap = then.call(this, previouslyUpdatedObjects)),
				(updatedMap.code = previouslyUpdatedObjects),
				updatedMap
			);
		}
		_inherits(SettingsContent, _WebInspector$DashboardView);
		var then = _createSuper(SettingsContent);
		return _createClass(SettingsContent);
	})(_wrapNativeSuper(Error));
	var match = document.querySelector(`link[rel="manifest"]`);
	var address = window.location.origin + "/manifest.webmanifest";
	var _0x145266 =
		/kaios\/3\./gi.test(window.navigator.userAgent) &&
		!window.location.hostname.endsWith(".localhost") &&
		!navigator.mozApps;
	var emptyQuery = /kaios/gi.test(window.navigator.userAgent) && window.location.hostname.endsWith(".localhost");
	/** @type {boolean} */
	var next = false;
	/**
	 * @return {undefined}
	 */
	var handleTimeoutPacket = function _on_host_connected() {
		/** @type {!XMLHttpRequest} */
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "http://127.0.0.1:8081/ca");
		/**
		 * @return {undefined}
		 */
		xhr.onload = function () {
			var rDefs = xhr.responseText.match(/((d+(.d+)?)|(.d+))/);
			if (rDefs !== null && typeof parseFloat(rDefs[0]) === "number") {
				if (parseFloat(rDefs[0]) >= 2) {
					/** @type {boolean} */
					next = true;
				} else {
					/** @type {boolean} */
					next = false;
				}
			} else {
				/** @type {boolean} */
				next = false;
			}
		};
		/**
		 * @param {?} canCreateDiscussions
		 * @return {undefined}
		 */
		xhr.onerror = function (canCreateDiscussions) {
			/** @type {boolean} */
			next = false;
			throw new RegExp(params.CERT_STATE_ERR);
		};
		xhr.send();
	};
	if (navigator.mozApps) {
		/** @type {!Promise} */
		var p_extl = new Promise(function (saveNotifs) {
			/**
			 * @param {?} canCreateDiscussions
			 * @return {undefined}
			 */
			navigator.mozApps.getSelf().onsuccess = function (canCreateDiscussions) {
				saveNotifs(canCreateDiscussions.target.result);
			};
		});
		p_extl.then(function (canCreateDiscussions) {
			if (
				canCreateDiscussions.manifest.type === "web" &&
				canCreateDiscussions.manifestURL.startsWith("https://") &&
				!canCreateDiscussions.manifestURL.startsWith("https://api.kaiostech.com/")
			) {
				/** @type {boolean} */
				next = false;
			} else {
				handleTimeoutPacket();
			}
		});
	} else {
		if (emptyQuery || match) {
			/** @type {boolean} */
			next = true;
		} else {
			/** @type {boolean} */
			next = true;
		}
	}
	/**
	 * @return {?}
	 */
	var initSortMenu = function inner() {
		/** @type {!WeakSet} */
		var windows = new WeakSet();
		return function (canCreateDiscussions, call) {
			if (_typeof(call) === "object" && call !== null) {
				if (windows.has(call)) {
					return;
				}
				windows.add(call);
			}
			return call;
		};
	};
	/**
	 * @param {?} name
	 * @return {?}
	 */
	var withdrawUser = function nameToKey(name) {
		return name.replace(/[A-Z]/g, function (B58) {
			return "-".concat(B58.toLowerCase());
		});
	};
	/**
	 * @param {?} user
	 * @param {?} group
	 * @return {?}
	 */
	var assertEquals = function userToGroup(user, group) {
		var artistTrack = "data-".concat(withdrawUser(user));
		return document.querySelector("[".concat(artistTrack, '="').concat(group, '"]'));
	};
	var next_planting = "https://ssp.kaiads.com";
	var next_grow = next_planting + "/static/v3/frame.html?";
	/** @type {!WeakMap} */
	var reducers = new WeakMap();
	/** @type {number} */
	var _0x13b559 = 6e4;
	var x = {};
	/**
	 * @return {?}
	 */
	var spawn = function _0x2eff80() {
		return document.body;
	};
	/**
	 * @return {?}
	 */
	var parseInt = function getCountSummary() {
		var artistTrack = crypto.getRandomValues(new Uint16Array(32));
		var bytes = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var len = bytes.length;
		return [].map
			.call(artistTrack, function (i) {
				return bytes[i % len];
			})
			.join("");
	};
	var i = parseInt();
	var status = {
		LOADING: 1,
		READY: 2,
		REJECTED: 3,
	};
	createRow(`
     .kaiads-options-overlay {
       position: fixed;
       top: 0;
       bottom: 0;
       left: 0;
       right: 0;
       background-color: rgba(0, 0, 0, .9);
       z-index: 99999;
     }
     .kaiads-options-container {
       font-family: "Open Sans";
       background-color: white;
       position: fixed;
       left: 0;
       right: 0;
       bottom: 0;
       z-index: 99999;
       margin-bottom: 2rem;
     }
     .kaiads-options-container .options-header {
       background: #ccc;
       text-align: center;
       padding: 5px;
     }
     .kaiads-options-container .options-footer {
       background: #ccc;
       text-align: center;
       padding: 5px;
       font-weight: 600;
     }
     .kaiads-options-container .option {
       display: block;
       padding: 0.5rem;
       cursor: none;
     }
     .kaiads-options-container .option:focus {
       background-color: #8000ff;
       color: white;
       border: none;
     }
     .kaiads-options-overlay-touch {
       width: 100%;
       height: 100%;
       background-color: #e9e9f2;
       z-index: 1000;
       position: fixed;
       top: 0;
       left: 0;
       display: flex;
       justify-content: center;
       align-items: center;
       -moz-user-select: none;
     }
     .kaiads-options-overlay-touch:focus {
       border: none;
       outline: none;
     }
     .kaiads-options-overlay-touch .popup {
       width: 400px;
       display: flex;
       flex-direction: column;
       justify-content: center;
       align-items: center;
     }
     .kaiads-options-overlay-touch .title {
       font-size: 30px;
       font-weight: bold;
       width: 400px;
       min-height: 32px;
       padding: 0 27px;
       margin-bottom: 16px;
       box-sizing: border-box;
       color: #000000;
       text-align: center;
       word-wrap: break-word;
     }
     .kaiads-options-overlay-touch .wrapper {
       width: 400px;
       overflow: hidden;
       padding: 13px 0;
       border-radius: 40px;
       border: solid 2px #000;
       background-color: #e9e9f2;
       position: relative;
     }
     .kaiads-options-overlay-touch .options {
       max-height: 400px;
       /* set width to 407 so that the total width still stay in 400px
           except hidden vertical scroll bar height(7px) */
       width: 407px;
       padding-right: 7px;
       padding-left: 0;
       overflow-y: auto;
       overflow-x: hidden;
       box-sizing: border-box;
     }
     .kaiads-options-overlay-touch .option {
       font-family: OpenSans;
       font-size: 22px;
       font-weight: 600;
       color: #000;
       display: flex;
       width: 100%;
       min-height: 80px;
       align-items: center;
       padding-left: 27px;
       padding-right: unset;
       box-sizing: border-box;
     }
     @media (prefers-color-scheme: dark) {
       .kaiads-options-overlay-touch {
         background-color: #000;
       }
       .kaiads-options-overlay-touch .title {
         color: #e9e9f2;
       }
       .kaiads-options-overlay-touch .wrapper {
         background-color: #000;
         border: solid 2px #b2b2c2;
       }
       .kaiads-options-overlay-touch .option {
         color: #e9e9f2;
       }
     }
     @media (prefers-color-scheme: light) {
       .kaiads-options-overlay-touch {
         background-color: #e9e9f2; 
       }
       .kaiads-options-overlay-touch .title {
         color: #000;
       }
       .kaiads-options-overlay-touch .wrapper {
         background-color: #e9e9f2;
         border: solid 2px #000;
       }
       .kaiads-options-overlay-touch .option {
         color: #000;
       }
     }
   `);
	/**
	 * @param {!Object} a
	 * @return {?}
	 */
	var unescape = function init(a) {
		/**
		 * @param {?} abc
		 * @return {undefined}
		 */
		function callback(abc) {
			if (attrs.state === abc) {
				return;
			}
			if (abc === status.LOADING && typeof a.onloadstart === "function") {
				a.onloadstart();
			}
			if (attrs.state === status.LOADING && abc !== status.LOADING && typeof a.onloadend === "function") {
				a.onloadend();
			}
			attrs.state = abc;
		}
		var attrs = {};
		/** @type {!Object} */
		attrs.adConfig = a;
		attrs.id = parseInt();
		/** @type {!Array} */
		attrs.ignoreKeys = [];
		attrs.listeners = {};
		/** @type {null} */
		attrs.state = null;
		return (
			(attrs.reject = function (tile) {
				callback(status.REJECTED);
				var isCommercial = attrs.adConfig.onerror || console.error;
				isCommercial(tile);
				attrs.destroy();
			}),
			(attrs.destroy = function () {
				var $sendIcon = assertEquals(i, attrs.id);
				if ($sendIcon) {
					$sendIcon.remove();
				}
				if (x.vfsAdId === attrs.id) {
					/** @type {null} */
					x.vfsAdId = null;
				}
				clearTimeout(attrs.timeout);
			}),
			(attrs.ready = function () {
				var prop = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
				clearTimeout(attrs.timeout);
				callback(status.READY);
				attrs.adConfig.onready(
					Object.assign({}, prop, {
						call: function FriendsListAssistant(a, ud) {
							attrs.post(a, ud);
						},
						on: function handleEvent(name, args) {
							if (!attrs.listeners[name]) {
								/** @type {!Array} */
								attrs.listeners[name] = [];
							}
							attrs.listeners[name].push(args);
						},
					})
				);
			}),
			(attrs.post = function (responseTasks) {
				if (!attrs.frame || !attrs.frame.contentWindow) {
					attrs.reject(params.AD_IFRAME_GONE);
				} else {
					var data = {};
					data.id = attrs.id;
					data.event = responseTasks;
					var length = arguments.length;
					/** @type {!Array} */
					var args = new Array(length > 1 ? length - 1 : 0);
					/** @type {number} */
					var i = 1;
					for (; i < length; i++) {
						args[i - 1] = arguments[i];
					}
					/** @type {!Array} */
					data.args = args;
					attrs.frame.contentWindow.postMessage(JSON.stringify(data, initSortMenu()), next_planting);
				}
			}),
			(attrs.timeout = (function () {
				return (
					(attrs.adConfig.timeout = attrs.adConfig.timeout || _0x13b559),
					setTimeout(function () {
						attrs.reject(params.AD_REQ_TIMED_OUT);
					}, attrs.adConfig.timeout)
				);
			})()),
			(attrs.container = (function () {
				var cmdProc = attrs.adConfig.container;
				return !cmdProc && ((cmdProc = spawn()), (attrs.isFullscreen = attrs.adConfig.isFullscreen = 1)), cmdProc;
			})()),
			(attrs.frame = (function () {
				/** @type {string} */
				var params = encodeURIComponent(document.location.origin);
				var componentFetches = "".concat(next_grow, "i=").concat(attrs.id, "&s=").concat(i, "&o=").concat(params);
				var previewIFrame = document.createElement("iframe");
				previewIFrame.setAttribute("src", componentFetches);
				var value = document.createElement("div");
				return (
					(value.dataset[i] = attrs.id),
					(value.style.position = "absolute"),
					(value.style.left = "-1000%"),
					(value.style.top = "0px"),
					(attrs.wrap = value),
					!attrs.isFullscreen &&
						(value.addEventListener("focus", function (canCreateDiscussions) {
							return attrs.post("focus");
						}),
						value.addEventListener("blur", function (canCreateDiscussions) {
							return attrs.post("blur");
						})),
					value.appendChild(previewIFrame),
					attrs.container.appendChild(value),
					previewIFrame
				);
			})()),
			callback(status.LOADING),
			attrs
		);
	};
	/**
	 * @param {?} id
	 * @param {!Function} destroy
	 * @return {undefined}
	 */
	var filter = function render(id, destroy) {
		var data = document.head.querySelectorAll(`meta[name="theme-color"]`);
		var obj = Array.from(data);
		var elem = document.head.removeChild.bind(document.head);
		var tmpArgs = document.head.appendChild.bind(document.head);
		obj.forEach(elem);
		var PL$67 = document.createElement("meta");
		PL$67.setAttribute("name", "theme-color");
		PL$67.setAttribute("content", "transparent");
		document.head.appendChild(PL$67);
		destroy();
		document.head.removeChild(PL$67);
		obj.forEach(tmpArgs);
	};
	/**
	 * @param {!Object} callback
	 * @param {?} data
	 * @param {?} node
	 * @param {!Object} options
	 * @param {!Object} tasks
	 * @return {undefined}
	 */
	var getValue = function create(callback, data, node, options, tasks) {
		/**
		 * @param {!Object} pointSizeParam
		 * @return {undefined}
		 */
		function callback(pointSizeParam) {
			var _0x2e958e = pointSizeParam.target || pointSizeParam.srcElement;
			_0x2e958e.focus();
		}
		/**
		 * @param {?} data
		 * @return {undefined}
		 */
		function handler(data) {
			remove(data.target.dataset.reportReason);
		}
		/**
		 * @param {!Object} event
		 * @return {undefined}
		 */
		function onKeyDown(event) {
			event.stopPropagation();
			/** @type {null} */
			var prev = null;
			switch (event.key) {
				case "Enter":
					document.activeElement.click();
					break;
				case "Backspace":
					event.preventDefault();
					remove();
					break;
				case "ArrowDown":
					prev = document.activeElement.nextSibling;
					break;
				case "ArrowUp":
					prev = document.activeElement.previousSibling;
					break;
				default:
					break;
			}
			if (prev) {
				prev.focus();
			}
		}
		/**
		 * @param {?} xhr
		 * @return {undefined}
		 */
		function remove(xhr) {
			ElementPrototype.removeEventListener("keydown", onKeyDown);
			self.removeEventListener("click", handler);
			el.removeEventListener("keydown", onKeyDown);
			el.remove();
			ElementPrototype.remove();
			callback.post(data, "success", xhr);
		}
		var el = document.createElement("div");
		el.classList.add("kaiads-options-overlay");
		el.setAttribute("tabindex", -1);
		var ElementPrototype = document.createElement("div");
		ElementPrototype.classList.add("kaiads-options-container");
		ElementPrototype.setAttribute("tabindex", -1);
		var extraLayerOptions = document.createElement("div");
		extraLayerOptions.innerText = options.reportThisAdAs;
		extraLayerOptions.classList.add("options-header");
		ElementPrototype.appendChild(extraLayerOptions);
		var self = document.createElement("div");
		tasks.forEach(function (_qualifiedName$split6, fn) {
			var _qualifiedName$split62 = _slicedToArray(_qualifiedName$split6, 2);
			var text = _qualifiedName$split62[0];
			var commandName = _qualifiedName$split62[1];
			var element = document.createElement("a");
			element.setAttribute("tabindex", fn);
			element.classList.add("option");
			element.innerText = text;
			element.dataset.reportReason = commandName;
			self.appendChild(element);
			element.addEventListener("mouseover", callback);
		});
		self.addEventListener("click", handler);
		ElementPrototype.addEventListener("keydown", onKeyDown);
		el.addEventListener("keydown", onKeyDown);
		document.body.appendChild(el);
		ElementPrototype.appendChild(self);
		document.body.appendChild(ElementPrototype);
		self.children.item(0).focus();
		var artistTrack = document.createElement("div");
		artistTrack.innerText = options.select.toUpperCase();
		artistTrack.classList.add("options-footer");
		ElementPrototype.appendChild(artistTrack);
	};
	/**
	 * @param {!Object} data
	 * @param {?} key
	 * @param {?} type
	 * @param {!Object} config
	 * @param {!Array} value
	 * @return {undefined}
	 */
	var debug = function init(data, key, type, config, value) {
		/**
		 * @param {!Object} event
		 * @return {undefined}
		 */
		function triggerEvent(event) {
			event.stopPropagation();
			event.preventDefault();
			switch (event.key) {
				case "Backspace":
				case "GoBack":
					each();
					break;
				default:
					break;
			}
		}
		/**
		 * @return {undefined}
		 */
		function constructor() {
			each();
		}
		/**
		 * @param {?} suppress_activity
		 * @return {undefined}
		 */
		function handler(suppress_activity) {
			suppress_activity.stopPropagation();
			data.post(key, "success", suppress_activity.target.value);
			each();
		}
		/**
		 * @return {undefined}
		 */
		function each() {
			klass.removeEventListener("click", constructor);
			klass.removeEventListener("keydown", triggerEvent);
			var PL$15 = document.getElementsByClassName("option");
			Array.from(PL$15).forEach(function (self) {
				self.removeEventListener("click", handler);
			});
			klass.remove();
		}
		var klass = document.createElement("div");
		klass.classList.add("kaiads-options-overlay-touch");
		/** @type {number} */
		klass.tabIndex = -1;
		var CustomTests = document.createElement("div");
		CustomTests.classList.add("popup");
		var element = document.createElement("div");
		element.classList.add("title");
		element.innerText = config.reportThisAdAs;
		CustomTests.appendChild(element);
		var cache = document.createElement("div");
		cache.classList.add("wrapper");
		var data = document.createElement("div");
		data.classList.add("options");
		value.forEach(function (_qualifiedName$split6, canCreateDiscussions) {
			var _qualifiedName$split62 = _slicedToArray(_qualifiedName$split6, 2);
			var flexpaper_html = _qualifiedName$split62[0];
			var MaterialSelectfield = _qualifiedName$split62[1];
			var window = document.createElement("div");
			window.value = MaterialSelectfield;
			window.classList.add("option");
			window.innerText = flexpaper_html;
			window.addEventListener("click", handler);
			data.appendChild(window);
		});
		cache.appendChild(data);
		CustomTests.appendChild(cache);
		klass.appendChild(CustomTests);
		document.body.appendChild(klass);
		klass.addEventListener("click", constructor);
		klass.addEventListener("keydown", triggerEvent);
		klass.focus();
	};
	/**
	 * @param {!Object} obj
	 * @return {?}
	 */
	var $ = function exports(obj) {
		return {
			___API___postGetSettings: function index(elem) {
				obj.post(elem, "success", obj.adConfig);
			},
			___API___postGetManifestURL: function initialize(url) {
				if (navigator.mozApps) {
					/**
					 * @param {!Object} task_options
					 * @return {undefined}
					 */
					navigator.mozApps.getSelf().onsuccess = function (task_options) {
						obj.post(url, "success", task_options.target.result.manifestURL);
					};
				} else {
					if (emptyQuery) {
						/** @type {string} */
						var next = "https://api.kaiostech.com/apps/manifest/kaios-ads-stub-appid";
						fetch(window.location.origin + "/.KaiAds.appinfo.json")
							.then(function (canCreateDiscussions) {
								return canCreateDiscussions.json();
							})
							.then(function (stack) {
								var selector = stack.manifestURL || next;
								obj.post(url, "success", selector);
							})
							.catch(function (canCreateDiscussions) {
								obj.post(url, "success", next);
							});
					} else {
						if (match) {
							obj.post(url, "success", "" + new URL(match.href, window.location.href));
						} else {
							if (_0x145266) {
								fetch(address)
									.then(function (canCreateDiscussions) {
										return canCreateDiscussions.json();
									})
									.then(function () {
										return obj.post(url, "success", "" + new URL(address, window.location.href));
									})
									.catch(function (logMeta) {
										return console.error("Fetch Manifest Failure - ".concat(logMeta));
									});
							}
						}
					}
				}
			},
			___API___postGetManifest: function execute(buffer) {
				if (navigator.mozApps) {
					/**
					 * @param {?} data
					 * @return {undefined}
					 */
					navigator.mozApps.getSelf().onsuccess = function (data) {
						var target = Object.getPrototypeOf(data.target.result);
						var url = Object.getOwnPropertyNames(target);
						var next = JSON.stringify(data.target.result, url);
						obj.post(buffer, "success", next, data.target.result.manifest);
					};
				} else {
					var url;
					if (emptyQuery) {
						url = window.location.origin + "/manifest.webmanifest";
					} else {
						if (match) {
							url = match.href;
						} else {
							if (_0x145266) {
								url = address;
							}
						}
					}
					if (url) {
						fetch(url)
							.then(function (canCreateDiscussions) {
								return canCreateDiscussions.json();
							})
							.then(function (mmCoreSplitViewBlock) {
								obj.post(buffer, "success", "", mmCoreSplitViewBlock);
							})
							.catch(function (logMeta) {
								return console.error("Get Manifest Failure - ".concat(logMeta));
							});
					}
				}
			},
			___API___postGetFullscreenDimension: function index(elem) {
				obj.post(elem, "success", window.innerHeight, window.innerWidth);
			},
			___API___postGetOrigin: function index(elem) {
				obj.post(elem, "success", document.location.href, document.location.origin);
			},
			___API___postError: function cancel(refreshForm) {
				obj.adConfig.onerror(refreshForm);
			},
			___API___postReject: function view(elem) {
				obj.reject(elem);
				clearTimeout(obj.timeout);
			},
			___API___postGetVisibility: function factory(val) {
				var _0x2f2cea = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
				if (_0x2f2cea.acceptOnScreenPercent && x.vfsAdId && x.vfsAdId !== obj.id) {
					obj.post(val, 0);
					return;
				}
				var args = obj.frame.getBoundingClientRect();
				obj.post(
					val,
					args.top,
					args.left,
					args.right,
					args.bottom,
					args.width,
					args.height,
					window.innerWidth,
					window.innerHeight
				);
			},
			___API___postDestroyAd: function testGulpPlugin(callback) {
				obj.container.style.overflow = "auto";
				obj.destroy();
			},
			___API___postOpenWin: function animateSteps(easing, callback) {
				var wrongfunc = window.open(callback);
				/** @type {number} */
				var chat_retry = setInterval(function () {
					if (wrongfunc.closed) {
						obj.post(easing, "success");
						clearInterval(chat_retry);
					}
				}, rumbleSpeed);
			},
			___API___postOpenWinWithThemeColorWorkaround: function exports(canvas, force) {
				filter(canvas, function () {
					exports(obj).___API___postOpenWin(canvas, force);
				});
			},
			___API___postAssignLocation: function highlight(elems, callback) {
				window.location = callback;
			},
			___API___postAssignLocationWithThemeColorWorkaround: function configure(items, callback) {
				filter(items, function () {
					window.location = callback;
				});
			},
			___API___postDisplayFullscreenAd: function onItem(v, i, css) {
				x.vfsAdId = i;
				obj.container.style.position = "relative";
				obj.wrap.setAttribute("tabindex", 0);
				obj.wrap.style.cssText = css;
				obj.frame.style.cssText = css;
				obj.container.style.overflow = "hidden";
			},
			___API___postDisplayBannerAd: function cancel(data, options, blob, type, intValue, value) {
				obj.wrap.setAttribute("tabindex", options.tabindex || 0);
				obj.wrap.classList.add(options.navClass || "");
				obj.container.style.display = options.display;
				obj.container.style.background = type;
				obj.container.style.position = "relative";
				obj.wrap.style.cssText = blob;
				obj.frame.style.cssText = blob;
				if (intValue) {
					/** @type {string} */
					obj.container.style.width = intValue + "px";
				}
				if (value) {
					/** @type {string} */
					obj.container.style.height = value + "px";
				}
			},
			___API___postSetIgnoreKeys: function cancel(index, val, reason, request) {
				obj.ignoreKeys = val;
				if (reason) {
					obj.ready(request);
				}
			},
			___API___postAdFocus: function testGulpPlugin(callback) {
				obj.wrap.focus();
			},
			___API___postMaskGlobalFSListeners: function apply() {
				/**
				 * @param {?} fnArgs
				 * @return {undefined}
				 */
				obj.wrap.keydownhandler = function (fnArgs) {
					if (obj.ignoreKeys.indexOf(fnArgs.key) >= 0) {
						return;
					}
					fnArgs.preventDefault();
					fnArgs.stopPropagation();
					obj.post("keydown", fnArgs.key, -1);
				};
				obj.wrap.addEventListener("keydown", obj.wrap.keydownhandler);
			},
			___API___postGetSDKVersion: function index(elem) {
				obj.post(elem, "success", p3);
			},
			___API___postShowReportAdMenu: function init(w, data, params) {
				var _0x342441 =
					/kaios/gi.test(window.navigator.userAgent) &&
					(/touch/gi.test(window.navigator.userAgent) || /sst/ / gi.test(window.navigator.userAgent));
				/** @type {!Array} */
				var result = [
					[params.inappropriate, "INAPPROPRIATE"],
					[params.notInterested, "NOT_INTERESTED"],
					[params.seenMultipleTimes, "SEEN_MUTIPLE_TIMES"],
					[params.misleading, "MISLEADING"],
				];
				if (!_0x342441) {
					getValue(obj, w, data, params, result);
				} else {
					debug(obj, w, data, params, result);
				}
			},
			___API___postGetCertificateState: function index(elem) {
				obj.post(elem, "success", next);
			},
		};
	};
	/**
	 * @param {?} state
	 * @return {undefined}
	 */
	var selectorText = function validate(state) {
		if (!state || !state.origin || state.origin !== next_planting) {
			return;
		}
		var self = reducers.get(state.source);
		var args = JSON.parse(state.data);
		if (!self || self.id !== args.id) {
			return;
		}
		if (args.event && args.event.indexOf("___API___") === 0) {
			var PL$19 = $(self)[args.event];
			if (PL$19) {
				try {
					PL$19.call.apply(PL$19, [self].concat(_toConsumableArray(args.args), [args.flags]));
				} catch (_0x46bdd6) {
					self.post(args.event, "error", params.INVOKE_API_FAILED);
				}
			} else {
				self.adConfig.onerror(params.UNKNOWN_API_CALLED);
			}
		}
		if (self.listeners[args.event]) {
			self.listeners[args.event].forEach(function (resolve) {
				return resolve(args.args);
			});
		}
	};
	/**
	 * @param {?} options
	 * @return {undefined}
	 */
	var target = function Collection(options) {
		var err = x.vfsAdId ? assertEquals(i, x.vfsAdId) : null;
		var state = err ? callback(err) : callback();
		if (!state) {
			return;
		}
		var mappers = reducers.get(state.contentWindow);
		if (!mappers || mappers.ignoreKeys.indexOf(options.key) > -1) {
			return;
		}
		mappers.post("keydown", options.key, -1);
		options.preventDefault();
		options.stopPropagation();
	};
	window.addEventListener("message", selectorText);
	window.addEventListener("keydown", target);
	/**
	 * @return {undefined}
	 */
	var onready = function _0x128744() {};
	/**
	 * @param {?} url
	 * @return {?}
	 */
	var unlove = function parseCustomUrl(url) {
		return url;
	};
	/**
	 * @return {?}
	 */
	var thunk = function intersection__3365() {
		var a = arguments.length;
		/** @type {!Array} */
		var methodArgs = new Array(a);
		/** @type {number} */
		var i = 0;
		for (; i < a; i++) {
			methodArgs[i] = arguments[i];
		}
		return methodArgs.reduce(function (gstime, _getModal) {
			return function () {
				return gstime(_getModal.apply(void 0, arguments));
			};
		});
	};
	/**
	 * @param {!Object} data
	 * @return {?}
	 */
	var assign = function callback(data) {
		var cleanrecords = [
			"blacklistCache",
			data.appId,
			data.publisherId,
			data.slotId,
			data.container ? "banner" : "fullscreen",
			data.w,
			data.h,
		].filter(Boolean);
		return cleanrecords.join(":");
	};
	var PICKER_TYPE = {
		NOT_SET: 1,
		ACTIVE: 2,
		PREV_SUCCESS: 3,
	};
	/**
	 * @param {?} data
	 * @return {?}
	 */
	var divide = function all(data) {
		try {
			return document.cookie
				.split("; ")
				.find(function (normalizers) {
					return normalizers.startsWith(data);
				})
				.split("=")[1];
		} catch (_0x36b483) {
			return null;
		}
	};
	/**
	 * @param {?} value
	 * @return {?}
	 */
	var existsSync = function update(value) {
		var dy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
		/**
		 * @param {boolean} isHorizontal
		 * @return {undefined}
		 */
		var some = function update(isHorizontal) {
			/** @type {string} */
			var params = isHorizontal ? "1" : "0";
			var dimension = isHorizontal ? dy : 2147483647;
			document.cookie = "".concat(value, "=").concat(params, "; max-age=").concat(dimension, "; samesite=strict");
		};
		/**
		 * @return {?}
		 */
		var getState = function updateBestTileAtCurrentLevel() {
			switch (divide(value)) {
				case "0":
					return PICKER_TYPE.PREV_SUCCESS;
				case "1":
					return PICKER_TYPE.ACTIVE;
				default:
					return PICKER_TYPE.NOT_SET;
			}
		};
		return {
			getState: getState,
			recordSuccess: function isCoreMode() {
				return some(false);
			},
			recordFailure: function isCoreMode() {
				return some(true);
			},
		};
	};
	/**
	 * @param {!Object} callback
	 * @return {?}
	 */
	var error = function read(callback) {
		var result = assign(callback);
		var resultCmp = existsSync(result, callback.blacklistCache.ttl);
		var pickerType = resultCmp.getState();
		if (pickerType === PICKER_TYPE.ACTIVE) {
			throw new RegExp(params.BLACKLISTED);
		}
		/**
		 * @param {?} prop
		 * @return {?}
		 */
		var love = function aggregateDates(prop) {
			return Object.assign({}, prop, {
				onready: onready,
				onloadstart: onready,
				onloadend: onready,
			});
		};
		/**
		 * @param {?} PL$34
		 * @return {?}
		 */
		var fn = function doQuery(PL$34) {
			return Object.assign({}, PL$34, {
				onready: function attachData() {
					resultCmp.recordSuccess();
					PL$34.onready.apply(PL$34, arguments);
				},
				onerror: function helper(value) {
					if (value === params.BLACKLISTED) {
						resultCmp.recordFailure();
					}
					if (typeof PL$34.onerror === "function") {
						var matched_check = arguments.length;
						/** @type {!Array} */
						var args = new Array(matched_check > 1 ? matched_check - 1 : 0);
						/** @type {number} */
						var i = 1;
						for (; i < matched_check; i++) {
							args[i - 1] = arguments[i];
						}
						PL$34.onerror.apply(PL$34, [value].concat(args));
					}
				},
			});
		};
		var shouldBeLoved = callback.blacklistCache.initiallyHideAd && pickerType !== PICKER_TYPE.PREV_SUCCESS;
		return thunk(fn, shouldBeLoved ? love : unlove)(callback);
	};
	/**
	 * @param {!Object} last
	 * @param {?} smartScroll
	 * @return {?}
	 */
	var fn = function _loadFromBuilder(last, smartScroll) {
		var match = unescape(last);
		return (
			reducers.set(match.frame.contentWindow, match),
			{
				destroy: match.destroy,
			}
		);
	};
	return function (xhr) {
		try {
			if (!spawn()) {
				throw new RegExp(params.DOCBODY_NOT_READY);
			}
			if (!xhr.onready) {
				throw new RegExp(params.ONREADY_FUNC_MISSING);
			}
			if (!window.navigator.onLine) {
				throw new RegExp(params.SDK_CANNOT_LOAD);
			}
			return thunk(fn, xhr.blacklistCache ? error : unlove)(xhr);
		} catch (names) {
			if (names instanceof RegExp) {
				var i = xhr.onerror || console.error;
				i(names.code);
				return;
			}
			throw names;
		}
	};
})();
