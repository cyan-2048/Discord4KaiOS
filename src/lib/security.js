import { xhr } from "./helper";

async function getFile(url) {
	const resp = await fetch(url);
	return digest(await resp.arrayBuffer());
}

async function digest(buffer) {
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer); // hash the message
	const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(""); // convert bytes to hex string
	return hashHex;
}

export async function checkSecurity({ main_page, bundle }) {
	if (_main_page == main_page && _bundle == bundle) {
		return true;
	}
	throw new Error("Security check failed");
}
