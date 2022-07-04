import { EventEmitter } from "./EventEmitter.js";
class FilePickerInstance extends EventEmitter {
	constructor(maxbytes = Infinity, cb = () => {}) {
		super();
		this.max = maxbytes;
		this.maxcb = cb;
	}
	_files = [];
	get files() {
		return this._files;
	}
	set files(value) {
		this._files = value;
		this.emit("change");
	}
	removeFile(index) {
		if (index === -1) this.files = [];
		else this.files = this.files.filter((a, i) => i !== index);
	}
	addFile(blob) {
		if (blob && blob instanceof Blob) {
			if (blob.size > this.max) return this.maxcb(blob);
			this.files = [...this.files, blob];
			return;
		}
		if (window.mozActivity) {
			const self = this;
			new MozActivity({ name: "pick" }).onsucess = function () {
				self.addFile(this.result.blob);
			};
		} else {
			let input = document.createElement("input");
			input.type = "file";
			input.onchange = () => {
				this.addFile(...input.files);
				input.onchange = null;
				input = null;
			};
			input.click();
		}
	}
}

export { FilePickerInstance };
