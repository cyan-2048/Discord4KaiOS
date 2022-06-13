import { EventEmitter } from "./EventEmitter.js";
class FilePickerInstance extends EventEmitter {
	files = [];
	removeFile(index) {
		if (index === -1) this.files = [];
		else this.files = files.filter((a, i) => i !== index);
		this.emit("change");
	}
	addFile(blob) {
		if (blob && blob instanceof Blob) {
			this.files.push(blob);
			this.emit("change");
			return;
		}
		if (window.mozActivity) {
			const self = this;
			new MozActivity({ name: "pick" }).onsucess = function () {
				files.push(this.result.blob);
				self.emit("change");
			};
		} else {
			let input = document.createElement("input");
			input.type = "file";
			input.onchange = () => {
				this.files = [...this.files, ...input.files];
				this.emit("change");
				input.onchange = null;
				input = null;
			};
			input.click();
		}
	}
}

export { FilePickerInstance };
