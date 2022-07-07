import { sn } from "../lib/shared";

export function handleBubble(e) {
	e.stopImmediatePropagation();
	e.stopPropagation();
	e.preventDefault();
}

export function handleButtons(id, length) {
	const sectionID = id + "-modals";
	sn.remove(sectionID);
	if (length > 3) {
		sn.add({
			id: sectionID,
			selector: `#${id}[data-modal] button`,
			restrict: "self-only",
		});
		sn.makeFocusable(sectionID);
		sn.focus(sectionID);
	}
}

export function decideSelected(key, length, align) {
	if (length > 3) return null;
	if (length === 2) {
		if (align !== "right" && key === "SoftLeft") {
			return 0;
			// if it is not right then it is either center or left
		}
		if (align !== "left" && key === "SoftRight") {
			return 1;
		}
		if (key === "Enter" && align !== "center") {
			return align === "left" ? 1 : 0;
		}
	}
	if (length === 3) {
		switch (key) {
			case "Enter":
				return 1;
			case "SoftLeft":
				return 0;
			case "SoftRight":
				return 2;
		}
	}
	if (length === 1) {
		if (
			(align === "left" && key === "SoftLeft") ||
			(align === "right" && key === "SoftRight") ||
			(align === "center" && key === "Enter")
		) {
			return 0;
		}
	}
	return null;
}
