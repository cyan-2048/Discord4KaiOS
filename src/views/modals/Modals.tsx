import Toast from "./Toast.tsx";
import FullscreenModal from "./fullscreen";
import Popup from "./popup";
import Slide from "./slide";
import Toolshed from "./toolshed";

export default function Modals() {
	return (
		<>
			<FullscreenModal />
			<Toast />
			<Toolshed />
			<Popup />
			<Slide />
		</>
	);
}
