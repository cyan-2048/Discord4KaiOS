import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import polyfillKaiOS from "./scripts/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import stringHash from "string-hash";

const cssFiles = [];

function shuffle(str: string) {
	var a = str.split(""),
		n = a.length;

	for (var i = n - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var tmp = a[i];
		a[i] = a[j];
		a[j] = tmp;
	}
	return a.join("");
}

const dictionary = shuffle("abcdefghijklmnopqrstuvwxyz");

function numberToEncodedLetter(number: number) {
	//Takes any number and converts it into a base (dictionary length) letter combo. 0 corresponds to an empty string.
	//It converts any numerical entry into a positive integer.
	if (isNaN(number)) {
		return undefined;
	}
	number = Math.abs(Math.floor(number));

	let index = number % dictionary.length;
	let quotient = number / dictionary.length;
	let result: string;

	if (number <= dictionary.length) {
		return numToLetter(number);
	} //Number is within single digit bounds of our encoding letter alphabet

	if (quotient >= 1) {
		//This number was bigger than our dictionary, recursively perform this function until we're done
		if (index === 0) {
			quotient--;
		} //Accounts for the edge case of the last letter in the dictionary string
		result = numberToEncodedLetter(quotient);
	}

	if (index === 0) {
		index = dictionary.length;
	} //Accounts for the edge case of the final letter; avoids getting an empty string

	return result + numToLetter(index);

	function numToLetter(number: number) {
		//Takes a letter between 0 and max letter length and returns the corresponding letter
		if (number > dictionary.length || number < 0) {
			return undefined;
		}
		if (number === 0) {
			return "";
		} else {
			return dictionary.slice(number - 1, number);
		}
	}
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [tsconfigPaths(), preact(), polyfillKaiOS()],
	server: {
		port: 3210,
	},
	build: {
		target: "es6",
		cssTarget: "firefox48",
		cssCodeSplit: false,
		modulePreload: false,
		assetsInlineLimit: 0,
		minify: false,
		ssr: false,
		rollupOptions: {
			output: {
				format: "iife",
			},
		},
	},
	css: {
		modules: {
			// generateScopedName(name, filename, css) {

			// },
			generateScopedName(name, filename, css) {
				const i = css.indexOf(`.${name}`);
				const lineNumber = css.substr(0, i).split(/[\r\n]/).length;
				const hash = stringHash(css).toString(36).substr(0, 5);

				const finalHash = `_${name}_${hash}_${lineNumber}`;
				const indexOf = cssFiles.indexOf(finalHash);
				const number = indexOf >= 0 ? indexOf : cssFiles.push(finalHash) - 1;

				return numberToEncodedLetter(number + 1);
			},
		},
	},
	worker: {
		plugins: [polyfillKaiOS()],
	},
});
