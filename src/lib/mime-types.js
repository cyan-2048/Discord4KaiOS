/**
 * mime-types
 * original: https://github.com/jshttp/mime-types/blob/master/index.js
 * changes by cyan: convert to es6, remove path dependency
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
import db from "mime-db";

/**
 * Module variables.
 * @private
 */

var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
var TEXT_TYPE_REGEXP = /^text\//i;

/**
 * Module exports.
 * @public
 */

const ex_extensions = Object.create(null);
const ex_types = Object.create(null);

// Populate the extensions/types maps
populateMaps(ex_extensions, ex_types);

export { ex_types as types };

/**
 * Get the default extension for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

export function extension(type) {
	if (!type || typeof type !== "string") {
		return false;
	}

	// TODO: use media-typer
	var match = EXTRACT_TYPE_REGEXP.exec(type);

	// get extensions
	var exts = match && ex_extensions[match[1].toLowerCase()];

	if (!exts || !exts.length) {
		return false;
	}

	return exts[0];
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps(extensions, types) {
	// source preference (least -> most)
	var preference = ["nginx", "apache", undefined, "iana"];

	Object.keys(db).forEach(function forEachMimeType(type) {
		var mime = db[type];
		var exts = mime.extensions;

		if (!exts || !exts.length) {
			return;
		}

		// mime -> extensions
		extensions[type] = exts;

		// extension -> mime
		for (var i = 0; i < exts.length; i++) {
			var extension = exts[i];

			if (types[extension]) {
				var from = preference.indexOf(db[types[extension]].source);
				var to = preference.indexOf(mime.source);

				if (
					types[extension] !== "application/octet-stream" &&
					(from > to || (from === to && types[extension].substr(0, 12) === "application/"))
				) {
					// skip the remapping
					continue;
				}
			}

			// set the extension -> mime
			types[extension] = type;
		}
	});
}
