import { Deferred } from "./utils";

export default function filePicker() {
	const deferred = new Deferred<File>();

	let input = document.createElement("input");
	input.type = "file";
	input.onchange = () => {
		deferred.resolve(input.files![0]);
		input.onchange = null;
	};
	input.click();

	return deferred.promise;
}
