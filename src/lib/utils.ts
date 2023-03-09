export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import scrollIntoView from "scroll-into-view";

export async function centerScroll(el: Element, sync = false) {
	return new Promise((res) => {
		scrollIntoView(el, { time: sync ? 0 : 200, align: { left: 0 }, ease: (e) => e }, (type) => res(type === "complete"));
	});
}
