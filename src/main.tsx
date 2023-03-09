import { useCallback, useContext, useEffect, useRef } from "preact/hooks";
import { h, render, Component, Fragment, ComponentProps } from "preact";

import VirtualScroll from "react-dynamic-virtual-scroll/dist/rvs-es.js";
import "./main.css";

import "./main.css";

import { centerScroll, sleep } from "./lib/utils";

const data = Array(1000)
	.fill(0)
	.map((_, i) =>
		Array(Math.floor(10 * Math.random()))
			.fill("a")
			.join("\n")
	);

const sizes = new Map<number, number>();

function rowRenderer({
	index, // Index of row
	isScrolling, // The List is currently being scrolled
	isVisible, // This row is visible within the List (eg it is not an overscanned row)
	key, // Unique key within array of rendered rows
	parent, // Reference to the parent List (instance)
	style, // Style object to be applied to row (to position it);
	// This must be passed through to the rendered row element.
}) {
	const item = data[index];

	const divElement = useRef<HTMLDivElement>(null);

	const { height, ...noHeight } = style;

	useEffect(() => {
		sizes.set(index, divElement.current.offsetHeight);
	});

	return (
		<div
			ref={divElement}
			onFocus={async (e) => {
				await sleep(80);
				if (divElement.current.tabIndex != index) {
					centerScroll(document.activeElement);
					return;
				}
				centerScroll(divElement.current);
			}}
			tabIndex={index}
			key={key}
			style={noHeight}
		>
			{index} WOW
			<pre>{item}</pre>
		</div>
	);
}

function App() {
	const renderItem = useCallback((rowIndex: number) => {
		return (
			<div
				onFocus={() => centerScroll(document.activeElement)}
				tabIndex={rowIndex}
				className="List-item"
				style={{
					background: rowIndex % 2 ? "lightgray" : "white",
				}}
			>
				{rowIndex}
				<pre>{data[rowIndex]}</pre>
			</div>
		);
	}, []);

	return (
		<>
			<div>
				<VirtualScroll buffer={10} className="List" minItemHeight={40} totalLength={data.length} renderItem={renderItem} />
			</div>
			<div>
				<h1>Hello, world!</h1>
				<p>
					This is a <a href="https://preactjs.com/">Preact</a> app.
				</p>
			</div>
		</>
	);
}

render(<App />, document.body);
