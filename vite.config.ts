import { defineConfig } from "vite";
import type { Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

const polyfillScript = String.raw`(()=>{var s;if(Object.getOwnPropertyDescriptors||(Object.getOwnPropertyDescriptors=function(o){if(o==null)throw new TypeError("Cannot convert undefined or null to object");const n=Object.getOwnPropertyDescriptor(o,"__proto__"),t=n?{["__proto__"]:n}:{};for(let e of Object.getOwnPropertyNames(o))t[e]=Object.getOwnPropertyDescriptor(o,e);return t}),(s=NodeList.prototype).forEach||(s.forEach=Array.prototype.forEach),typeof PromiseRejectionEvent=="undefined"){let o=function(n,t){const e=document.createEvent("Event");Object.defineProperties(e,{promise:{value:n,writable:!1},reason:{value:t,writable:!1}}),e.initEvent("unhandledrejection",!1,!0),window.dispatchEvent(e),console.error(n)};var f=o;const c=window.Promise;var i=function(n){if(!(this instanceof i))throw new TypeError("Cannot call a class as a function");const t=new c((e,p)=>{const r=a=>(setTimeout(()=>{t.handled!==!0&&o(t,a)},0),p(a));try{return n(e,r)}catch(a){return r(a)}});return t.__proto__=i.prototype,t};i.__proto__=c,i.prototype.__proto__=c.prototype,i.prototype.then=function(n,t){return c.prototype.then.call(this,n,t&&(e=>(this.handled=!0,t(e))))},i.prototype.catch=function(n){return c.prototype.catch.call(this,n&&(t=>(this.handled=!0,n(t))))},window.Promise=i}(function(c){function o(e){const p=document.createDocumentFragment();return e.forEach(r=>p.appendChild(r instanceof Node?r:document.createTextNode(String(r)))),p}const{defineProperty:n}=Object;function t(e,p,r){n(e,p,{configurable:!0,enumerable:!0,writable:!0,value:r})}c.forEach(function(e){e.hasOwnProperty("append")||t(e,"append",function(...r){this.appendChild(o(r))}),e.hasOwnProperty("prepend")||t(e,"prepend",function(...r){this.insertBefore(o(r),this.firstChild)}),e.hasOwnProperty("after")||t(e,"after",function(...r){var a=document.createDocumentFragment();r.forEach(function(u){a.appendChild(u instanceof Node?u:document.createTextNode(String(u)))}),this.parentNode.insertBefore(a,this.nextSibling)})})})([Element.prototype,Document.prototype,DocumentFragment.prototype]);const d=Document.prototype.createElement;Document.prototype.createElement=function(c){return d.call(this,c)}})();`;

function polyfillKaiOS(): Plugin {
	return {
		name: "polyfill-kai",

		transformIndexHtml(html) {
			return html.replace(/type="module" crossorigin/g, "defer");
		},

		generateBundle(options, bundle) {
			const regexp = /for((\s?)*)\(((\s?)*)const/g;
			for (const fileName in bundle) {
				if (fileName.endsWith(".js")) {
					const output = bundle[fileName];
					if (output && "code" in output) {
						const code = output.code.replace(regexp, "for(let ");
						if (!code) continue;
						output.code = polyfillScript + "\n\n" + code;
					}
				}
			}
		},
	};
}

// @ts-ignore
const production = process.env.NODE_ENV === "production";

export default defineConfig({
	plugins: [tsconfigPaths(), solidPlugin(), production && polyfillKaiOS()],
	server: {
		port: 3000,
	},
	build: {
		target: "es6",
		cssTarget: "firefox48",
		cssCodeSplit: false,
		modulePreload: false,
		assetsInlineLimit: 0,
		minify: true,
		rollupOptions: {
			output: {
				format: "iife",
			},
		},
	},
});
