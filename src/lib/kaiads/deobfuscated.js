"use strict";

(function () {
	/**
	 * @param {?} db
	 * @param {string} storeName
	 * @return {?}
	 */
	function getCompoundIndex(db, storeName) {
		var lhs = db.split(".");
		var rhs = storeName.split(".");
		for (; lhs.length < rhs.length; ) {
			lhs.push("0");
		}
		for (; rhs.length < lhs.length; ) {
			rhs.push("0");
		}
		/** @type {number} */
		var property = 0;
		for (; property < lhs.length; ++property) {
			if (lhs[property] == rhs[property]) {
				continue;
			} else {
				return lhs[property] > rhs[property] ? 1 : -1;
			}
		}
		return 0;
	}
	var selected_group = this;
	/** @type {!Array} */
	var search = [];
	/**
	 * @param {!Function} mActionBar
	 * @return {undefined}
	 */
	function finishedWrite(mActionBar) {
		search.forEach(function (selected_group_obj_array) {
			mActionBar.apply(selected_group, selected_group_obj_array);
		});
		/** @type {!Array} */
		search = [];
	}
	/**
	 * @return {undefined}
	 */
	window.getKaiAd = function () {
		search.push(arguments);
	};
	/** @type {boolean} */
	window.getKaiAd.dummy = true;
	/**
	 * @param {?} prototype
	 * @return {undefined}
	 */
	var val = function Function_define(prototype) {
		if (typeof prototype.onerror === "function") {
			/** @type {number} */
			var path = 19;
			prototype.onerror(path);
		}
	};
	/**
	 * @param {string} url
	 * @return {?}
	 */
	function fetchScriptInternal(url) {
		return new Promise(function (saveNotifs, negater) {
			var script = document.createElement("script");
			script.addEventListener("load", function () {
				if (!getKaiAd || getKaiAd.dummy) {
					negater();
				} else {
					saveNotifs();
				}
			});
			script.addEventListener("error", function () {
				negater();
			});
			/** @type {string} */
			script.src = url;
			document.head.appendChild(script);
		});
	}
	var lastrayafteradjust;
	if (window.navigator.mozApps) {
		/**
		 * @param {!Object} task_options
		 * @return {undefined}
		 */
		window.navigator.mozApps.getSelf().onsuccess = function (task_options) {
			var manifestSplashScreenMap = task_options.target.result;
			if (
				!manifestSplashScreenMap ||
				!manifestSplashScreenMap.manifest ||
				!manifestSplashScreenMap.manifest.type ||
				manifestSplashScreenMap.manifest.type === "web"
			) {
				lastrayafteradjust = fetchScriptInternal("https://static.kaiads.com/ads-sdk/ads-sdk.v5.min.js");
			}
			if (!lastrayafteradjust) {
				var regex = / kaios\/((?:\d+.)*\d+)/gi.exec(window.navigator.userAgent);
				if (regex && getCompoundIndex(regex[1], "2.5") === 1) {
					lastrayafteradjust = fetchScriptInternal("http://127.0.0.1/sdk/ads/ads-sdk.min.js").catch(function () {
						return fetchScriptInternal("http://127.0.0.1:8081/sdk/ads/ads-sdk.min.js");
					});
				}
			}
			if (!lastrayafteradjust) {
				lastrayafteradjust = Promise.reject();
			}
			lastrayafteradjust
				.catch(function () {
					finishedWrite(val);
					/** @type {function(?): undefined} */
					window.getKaiAd = val;
					/** @type {function(?): undefined} */
					getKaiAd = val;
				})
				.then(function () {
					finishedWrite(getKaiAd);
					window.getKaiAd = getKaiAd;
				});
		};
	} else {
		if (/kaios/gi.test(window.navigator.userAgent) && window.location.hostname.endsWith(".localhost")) {
			lastrayafteradjust = fetchScriptInternal("http://127.0.0.1/sdk/ads/ads-sdk.min.js");
		} else {
			lastrayafteradjust = fetchScriptInternal("https://static.kaiads.com/ads-sdk/ads-sdk.v5.min.js");
		}
		if (!lastrayafteradjust) {
			lastrayafteradjust = Promise.reject();
		}
		lastrayafteradjust
			.catch(function () {
				finishedWrite(val);
				/** @type {function(?): undefined} */
				window.getKaiAd = val;
				/** @type {function(?): undefined} */
				getKaiAd = val;
			})
			.then(function () {
				finishedWrite(getKaiAd);
				window.getKaiAd = getKaiAd;
			});
	}
})();
