import { ErrorBoundary, Show, Suspense, lazy, onCleanup, onMount } from "solid-js";
import SpatialNavigation from "./lib/spatial_navigation";
import { discordClientReady } from "./signals";
import Loading from "./views/Loading";

const MainView = lazy(() => import("./MainView"));
import Modals from "./views/modals/Modals";

function App() {
	onMount(() => {
		SpatialNavigation.init();
	});

	onCleanup(() => {
		SpatialNavigation.uninit();
	});

	return (
		<>
			<Modals />
			<svg
				viewBox="0 0 1 1"
				style="position: fixed; pointer-events: none; top: -1px; left: -1px; width: 1px; height: 1px"
				aria-hidden="true"
			>
				<mask id="round-avatar-status" width="32" height="32">
					<circle cx="16" cy="16" r="16" fill="white"></circle>
					<rect fill="black" x="19" y="19" width="16" height="16" rx="8" ry="8"></rect>
				</mask>
				<mask
					id="mobile-avatar-status"
					maskContentUnits="objectBoundingBox"
					// @ts-ignore
					viewBox="0 0 1 1"
				>
					<circle fill="white" cx="0.5" cy="0.5" r="0.5"></circle>
					<rect
						fill="black"
						x="0.59375"
						y="0.4375"
						width="0.5"
						height="0.65625"
						rx="0.13125"
						ry="0.13125"
					></rect>
				</mask>
				<mask id="typing-avatar-status" width="32" height="32">
					<circle cx="16" cy="16" r="16" fill="white"></circle>
					<rect fill="black" x="11.5" y="19" width="31" height="16" rx="8" ry="8"></rect>
				</mask>
			</svg>
			<Show when={discordClientReady()} fallback={<Loading />}>
				<div class="LOADING"></div>
				<MainView />
			</Show>
		</>
	);
}

function ErrorOccured(props: { restart: () => void }) {
	const timeout = setTimeout(() => {
		props.restart();
	}, 3000);

	onCleanup(() => clearTimeout(timeout));

	return (
		<div>
			<h1>Error</h1>
			<p>Something went wrong</p>
		</div>
	);
}

function __reportError__(error: any) {
	if (
		confirm("Do you want to help the dev find out why? The app will privately send a bug report to the dev")
	) {
		fetch(import.meta.env.VITE_DEBUG_URL, {
			method: "POST",
			body: JSON.stringify(error),
		});
	} else
		try {
			alert("Screenshot this entire thing and send it to the developer: \n\n" + JSON.stringify(error));
		} catch {}
}

Object.assign(window, { __reportError__ });

function ErrorBoundary_App() {
	return (
		<ErrorBoundary
			fallback={(error, restart) => {
				console.error(error);
				alert("solid.js error occured");

				__reportError__(error);

				return <ErrorOccured restart={restart} />;
			}}
		>
			{<App />}
		</ErrorBoundary>
	);
}

export default ErrorBoundary_App;
