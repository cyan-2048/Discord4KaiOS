/**
 * this file contains the polyfills that will be loaded before anything else
 * WARNING: the code will also be executed in workers, be cautious in adding polyfills
 */
const s = self;

// this is needed because esbuild es6 transpiled code requires it
Object.getOwnPropertyDescriptors ||= function getOwnPropertyDescriptors(obj) {
	if (obj === null || obj === undefined) {
		throw new TypeError("Cannot convert undefined or null to object");
	}

	const protoPropDescriptor = Object.getOwnPropertyDescriptor(obj, "__proto__");
	const descriptors = protoPropDescriptor ? { ["__proto__"]: protoPropDescriptor } : {};

	for (let name of Object.getOwnPropertyNames(obj)) {
		descriptors[name] = Object.getOwnPropertyDescriptor(obj, name);
	}

	return descriptors;
};

if (s.NodeList) NodeList.prototype.forEach ||= Array.prototype.forEach;

// code stolen here: https://github.com/ustccjw/unhandled-rejection-polyfill/blob/master/src/index.js
if (typeof PromiseRejectionEvent === "undefined") {
	const Promise = s.Promise;

	function dispatchUnhandledRejectionEvent(promise, reason) {
		const event = document.createEvent("Event");
		Object.defineProperties(event, {
			promise: {
				value: promise,
				writable: false,
			},
			reason: {
				value: reason,
				writable: false,
			},
		});
		event.initEvent("unhandledrejection", false, true);
		s.dispatchEvent(event);
		console.error(promise);
	}

	const MyPromise = function (resolver) {
		if (!(this instanceof MyPromise)) {
			throw new TypeError("Cannot call a class as a function");
		}
		const promise = new Promise((resolve, reject) => {
			const customReject = (reason) => {
				// macro-task(setTimeout) will execute after micro-task(promise)
				setTimeout(() => {
					if (promise.handled !== true) dispatchUnhandledRejectionEvent(promise, reason);
				}, 0);
				return reject(reason);
			};
			try {
				return resolver(resolve, customReject);
			} catch (err) {
				return customReject(err);
			}
		});
		promise.__proto__ = MyPromise.prototype;
		return promise;
	};

	MyPromise.__proto__ = Promise;
	MyPromise.prototype.__proto__ = Promise.prototype;

	MyPromise.prototype.then = function (resolve, reject) {
		return Promise.prototype.then.call(
			this,
			resolve,
			reject &&
				((reason) => {
					this.handled = true;
					return reject(reason);
				})
		);
	};

	MyPromise.prototype.catch = function (reject) {
		return Promise.prototype.catch.call(
			this,
			reject &&
				((reason) => {
					this.handled = true;
					return reject(reason);
				})
		);
	};

	s.Promise = MyPromise;
}

// Source: https://gitlab.com/ollycross/element-polyfill
(function (arr) {
	function docFragger(args) {
		const docFrag = document.createDocumentFragment();

		args.forEach((argItem) => docFrag.appendChild(argItem instanceof Node ? argItem : document.createTextNode(String(argItem))));

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
})([s.Element?.prototype, s.Document?.prototype, s.DocumentFragment?.prototype]);

if (s.Document) {
	// toFix that weird is=undefined attribute that happens because KaiOS tries to do webcomponents but fails miserably
	const createElOriginal = Document.prototype.createElement;

	Document.prototype.createElement = function (type) {
		return createElOriginal.call(this, type);
	};

	/**
	 * Copyright 2016 Google Inc. All Rights Reserved.
	 *
	 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
	 *
	 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
	 *
	 */
	// prettier-ignore
	!function(){"use strict";if("object"==typeof window&&!("IntersectionObserver"in window&&"IntersectionObserverEntry"in window&&"intersectionRatio"in window.IntersectionObserverEntry.prototype)){var t=function(t){for(var e=window.document,o=i(e);o;)o=i(e=o.ownerDocument);return e}(),e=[],o=null,n=null;s.prototype.THROTTLE_TIMEOUT=100,s.prototype.POLL_INTERVAL=null,s.prototype.USE_MUTATION_OBSERVER=!0,s._setupCrossOriginUpdater=function(){return o||(o=function(t,o){n=t&&o?l(t,o):{top:0,bottom:0,left:0,right:0,width:0,height:0},e.forEach((function(t){t._checkForIntersections()}))}),o},s._resetCrossOriginUpdater=function(){o=null,n=null},s.prototype.observe=function(t){if(!this._observationTargets.some((function(e){return e.element==t}))){if(!t||1!=t.nodeType)throw new Error("target must be an Element");this._registerInstance(),this._observationTargets.push({element:t,entry:null}),this._monitorIntersections(t.ownerDocument),this._checkForIntersections()}},s.prototype.unobserve=function(t){this._observationTargets=this._observationTargets.filter((function(e){return e.element!=t})),this._unmonitorIntersections(t.ownerDocument),0==this._observationTargets.length&&this._unregisterInstance()},s.prototype.disconnect=function(){this._observationTargets=[],this._unmonitorAllIntersections(),this._unregisterInstance()},s.prototype.takeRecords=function(){var t=this._queuedEntries.slice();return this._queuedEntries=[],t},s.prototype._initThresholds=function(t){var e=t||[0];return Array.isArray(e)||(e=[e]),e.sort().filter((function(t,e,o){if("number"!=typeof t||isNaN(t)||t<0||t>1)throw new Error("threshold must be a number between 0 and 1 inclusively");return t!==o[e-1]}))},s.prototype._parseRootMargin=function(t){var e=(t||"0px").split(/\s+/).map((function(t){var e=/^(-?\d*\.?\d+)(px|%)$/.exec(t);if(!e)throw new Error("rootMargin must be specified in pixels or percent");return{value:parseFloat(e[1]),unit:e[2]}}));return e[1]=e[1]||e[0],e[2]=e[2]||e[0],e[3]=e[3]||e[1],e},s.prototype._monitorIntersections=function(e){var o=e.defaultView;if(o&&-1==this._monitoringDocuments.indexOf(e)){var n=this._checkForIntersections,r=null,s=null;this.POLL_INTERVAL?r=o.setInterval(n,this.POLL_INTERVAL):(h(o,"resize",n,!0),h(e,"scroll",n,!0),this.USE_MUTATION_OBSERVER&&"MutationObserver"in o&&(s=new o.MutationObserver(n)).observe(e,{attributes:!0,childList:!0,characterData:!0,subtree:!0})),this._monitoringDocuments.push(e),this._monitoringUnsubscribes.push((function(){var t=e.defaultView;t&&(r&&t.clearInterval(r),u(t,"resize",n,!0)),u(e,"scroll",n,!0),s&&s.disconnect()}));var c=this.root&&(this.root.ownerDocument||this.root)||t;if(e!=c){var a=i(e);a&&this._monitorIntersections(a.ownerDocument)}}},s.prototype._unmonitorIntersections=function(e){var o=this._monitoringDocuments.indexOf(e);if(-1!=o){var n=this.root&&(this.root.ownerDocument||this.root)||t,r=this._observationTargets.some((function(t){var o=t.element.ownerDocument;if(o==e)return!0;for(;o&&o!=n;){var r=i(o);if((o=r&&r.ownerDocument)==e)return!0}return!1}));if(!r){var s=this._monitoringUnsubscribes[o];if(this._monitoringDocuments.splice(o,1),this._monitoringUnsubscribes.splice(o,1),s(),e!=n){var h=i(e);h&&this._unmonitorIntersections(h.ownerDocument)}}}},s.prototype._unmonitorAllIntersections=function(){var t=this._monitoringUnsubscribes.slice(0);this._monitoringDocuments.length=0,this._monitoringUnsubscribes.length=0;for(var e=0;e<t.length;e++)t[e]()},s.prototype._checkForIntersections=function(){if(this.root||!o||n){var t=this._rootIsInDom(),e=t?this._getRootRect():{top:0,bottom:0,left:0,right:0,width:0,height:0};this._observationTargets.forEach((function(n){var i=n.element,s=c(i),h=this._rootContainsTarget(i),u=n.entry,a=t&&h&&this._computeTargetAndRootIntersection(i,s,e),l=null;this._rootContainsTarget(i)?o&&!this.root||(l=e):l={top:0,bottom:0,left:0,right:0,width:0,height:0};var f=n.entry=new r({time:window.performance&&performance.now&&performance.now(),target:i,boundingClientRect:s,rootBounds:l,intersectionRect:a});u?t&&h?this._hasCrossedThreshold(u,f)&&this._queuedEntries.push(f):u&&u.isIntersecting&&this._queuedEntries.push(f):this._queuedEntries.push(f)}),this),this._queuedEntries.length&&this._callback(this.takeRecords(),this)}},s.prototype._computeTargetAndRootIntersection=function(e,i,r){if("none"!=window.getComputedStyle(e).display){for(var s,h,u,a,f,d,g,m,v=i,_=p(e),b=!1;!b&&_;){var w=null,y=1==_.nodeType?window.getComputedStyle(_):{};if("none"==y.display)return null;if(_==this.root||9==_.nodeType)if(b=!0,_==this.root||_==t)o&&!this.root?!n||0==n.width&&0==n.height?(_=null,w=null,v=null):w=n:w=r;else{var I=p(_),T=I&&c(I),E=I&&this._computeTargetAndRootIntersection(I,T,r);T&&E?(_=I,w=l(T,E)):(_=null,v=null)}else{var R=_.ownerDocument;_!=R.body&&_!=R.documentElement&&"visible"!=y.overflow&&(w=c(_))}if(w&&(s=w,h=v,u=void 0,a=void 0,f=void 0,d=void 0,g=void 0,m=void 0,u=Math.max(s.top,h.top),a=Math.min(s.bottom,h.bottom),f=Math.max(s.left,h.left),d=Math.min(s.right,h.right),m=a-u,v=(g=d-f)>=0&&m>=0&&{top:u,bottom:a,left:f,right:d,width:g,height:m}||null),!v)break;_=_&&p(_)}return v}},s.prototype._getRootRect=function(){var e;if(this.root&&!d(this.root))e=c(this.root);else{var o=d(this.root)?this.root:t,n=o.documentElement,i=o.body;e={top:0,left:0,right:n.clientWidth||i.clientWidth,width:n.clientWidth||i.clientWidth,bottom:n.clientHeight||i.clientHeight,height:n.clientHeight||i.clientHeight}}return this._expandRectByRootMargin(e)},s.prototype._expandRectByRootMargin=function(t){var e=this._rootMarginValues.map((function(e,o){return"px"==e.unit?e.value:e.value*(o%2?t.width:t.height)/100})),o={top:t.top-e[0],right:t.right+e[1],bottom:t.bottom+e[2],left:t.left-e[3]};return o.width=o.right-o.left,o.height=o.bottom-o.top,o},s.prototype._hasCrossedThreshold=function(t,e){var o=t&&t.isIntersecting?t.intersectionRatio||0:-1,n=e.isIntersecting?e.intersectionRatio||0:-1;if(o!==n)for(var i=0;i<this.thresholds.length;i++){var r=this.thresholds[i];if(r==o||r==n||r<o!=r<n)return!0}},s.prototype._rootIsInDom=function(){return!this.root||f(t,this.root)},s.prototype._rootContainsTarget=function(e){var o=this.root&&(this.root.ownerDocument||this.root)||t;return f(o,e)&&(!this.root||o==e.ownerDocument)},s.prototype._registerInstance=function(){e.indexOf(this)<0&&e.push(this)},s.prototype._unregisterInstance=function(){var t=e.indexOf(this);-1!=t&&e.splice(t,1)},window.IntersectionObserver=s,window.IntersectionObserverEntry=r}function i(t){try{return t.defaultView&&t.defaultView.frameElement||null}catch(t){return null}}function r(t){this.time=t.time,this.target=t.target,this.rootBounds=a(t.rootBounds),this.boundingClientRect=a(t.boundingClientRect),this.intersectionRect=a(t.intersectionRect||{top:0,bottom:0,left:0,right:0,width:0,height:0}),this.isIntersecting=!!t.intersectionRect;var e=this.boundingClientRect,o=e.width*e.height,n=this.intersectionRect,i=n.width*n.height;this.intersectionRatio=o?Number((i/o).toFixed(4)):this.isIntersecting?1:0}function s(t,e){var o,n,i,r=e||{};if("function"!=typeof t)throw new Error("callback must be a function");if(r.root&&1!=r.root.nodeType&&9!=r.root.nodeType)throw new Error("root must be a Document or Element");this._checkForIntersections=(o=this._checkForIntersections.bind(this),n=this.THROTTLE_TIMEOUT,i=null,function(){i||(i=setTimeout((function(){o(),i=null}),n))}),this._callback=t,this._observationTargets=[],this._queuedEntries=[],this._rootMarginValues=this._parseRootMargin(r.rootMargin),this.thresholds=this._initThresholds(r.threshold),this.root=r.root||null,this.rootMargin=this._rootMarginValues.map((function(t){return t.value+t.unit})).join(" "),this._monitoringDocuments=[],this._monitoringUnsubscribes=[]}function h(t,e,o,n){"function"==typeof t.addEventListener?t.addEventListener(e,o,n||!1):"function"==typeof t.attachEvent&&t.attachEvent("on"+e,o)}function u(t,e,o,n){"function"==typeof t.removeEventListener?t.removeEventListener(e,o,n||!1):"function"==typeof t.detachEvent&&t.detachEvent("on"+e,o)}function c(t){var e;try{e=t.getBoundingClientRect()}catch(t){}return e?(e.width&&e.height||(e={top:e.top,right:e.right,bottom:e.bottom,left:e.left,width:e.right-e.left,height:e.bottom-e.top}),e):{top:0,bottom:0,left:0,right:0,width:0,height:0}}function a(t){return!t||"x"in t?t:{top:t.top,y:t.top,bottom:t.bottom,left:t.left,x:t.left,right:t.right,width:t.width,height:t.height}}function l(t,e){var o=e.top-t.top,n=e.left-t.left;return{top:o,left:n,height:e.height,width:e.width,bottom:o+e.height,right:n+e.width}}function f(t,e){for(var o=e;o;){if(o==t)return!0;o=p(o)}return!1}function p(e){var o=e.parentNode;return 9==e.nodeType&&e!=t?i(e):(o&&o.assignedSlot&&(o=o.assignedSlot.parentNode),o&&11==o.nodeType&&o.host?o.host:o)}function d(t){return t&&9===t.nodeType}}();
}
