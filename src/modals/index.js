import { writable } from "svelte/store";
import { Promise_defer } from "../lib/helper";
import Wrapper from "./Wrapper.svelte";

const _snackbar = new Set();
const snackbar_set = writable(_snackbar);
const images = writable([]);
const dud = () => {};
const images_callback = writable(dud);

const wrapper_instance = new Wrapper({
	target: document.body,
	props: {
		snackbar_set,
		images,
		images_callback,
	},
});

export function snackbar(text, time = 3000) {
	const object = { text };
	_snackbar.add(object);
	snackbar_set.set(_snackbar);

	setTimeout(() => {
		_snackbar.delete(object);
		snackbar_set.set(_snackbar);
	}, time);
}

export function showImage(...array) {
	const { promise, resolve } = Promise_defer();

	images.set(array);
	images_callback.set(() => {
		resolve();
		images.set([]);
		images_callback.set(dud);
	});

	return promise;
}
