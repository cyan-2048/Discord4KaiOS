export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import scrollIntoView from "scroll-into-view";

export async function centerScroll(el: Element, sync = false, opts: object = {}) {
	return new Promise((res) => {
		scrollIntoView(el, { time: sync ? 0 : 200, align: { left: 0 }, ease: (e: number) => e, ...opts }, (type) => res(type === "complete"));
	});
}

export enum InternetResults {
	EXPIRED_CERTS,
	OK,
	NO_INTERNET,
}

async function verifyDomainSSL(url) {
	const u = new URL(url);
	return new Promise((resolve, reject) => {
		if (u.protocol === "http:") return resolve(url);
		// @ts-ignore
		const conn = navigator.mozTCPSocket?.open(u.host, 443, { useSecureTransport: true });
		if (!conn) return resolve(url);
		conn.onopen = () => {
			conn.close();
			conn.onerror = () => {};
			resolve(url);
		};
		conn.onerror = (err: Error) => {
			reject(err.name === "SecurityError" && err.message === "SecurityCertificate" ? InternetResults.EXPIRED_CERTS : InternetResults.NO_INTERNET);
		};
	});
}

export async function testInternet() {
	const statusURL = "https://discordstatus.com/api/v2/status.json";
	try {
		if (!navigator.onLine) return InternetResults.NO_INTERNET;
		await verifyDomainSSL(statusURL);

		const res = await fetch(statusURL);
		const { status } = await res.json();
		const index = ["none", "minor", "major", "critical"].indexOf(status.indicator);
		if (index > 1) return InternetResults.NO_INTERNET;
	} catch (e) {
		return typeof e === "number" ? e : InternetResults.NO_INTERNET;
	}
	return InternetResults.OK;
}
