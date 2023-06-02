import { RenderableProps, ComponentChild, cloneElement } from "preact";
import { JSX, PureComponent } from "preact/compat";

/**
 * chop chop the array! start at index, and go steps in either direction
 */
function chop<T = unknown>(arr: T[], index: number, steps: number) {
	if (index >= arr.length || index < 0) return [];

	let slice1 = 0,
		slice2 = 0;

	if (steps < 0) {
		slice1 = Math.max(index + steps, 0);
		slice2 = index;
	} else {
		slice1 = index;
		slice2 = Math.min(index + steps, arr.length);
	}

	return arr.slice(slice1, slice2 + 1);
}

interface VirtualListProps {
	items: JSX.Element[];
	focusedIndex: number;
	/**
	 * defaults to 10
	 */
	range?: number;
}

class VirtualList extends PureComponent<VirtualListProps> {
	render({ items, focusedIndex, range }: RenderableProps<VirtualListProps, any>, state?: Readonly<{}>, context?: any): ComponentChild {
		const _range = typeof range == "number" ? range : 10;
		let itemsBefore = chop(items, focusedIndex - 1, -_range);
		let itemsAfter = chop(items, focusedIndex, _range + Math.abs(itemsBefore.length - _range));

		if (itemsAfter.length < _range) {
			itemsBefore = chop(items, focusedIndex - 1, -_range - Math.abs(itemsAfter.length - _range));
			itemsAfter = chop(items, focusedIndex, _range);
		}

		return itemsBefore.concat(itemsAfter);
	}
}

export default VirtualList;
