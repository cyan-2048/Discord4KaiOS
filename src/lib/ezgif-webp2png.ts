export default function webp2png(url: string) {
	return new Promise<string>((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		const form = new FormData();
		form.set("new-image", new File([], "", { type: "application/octet-stream" }));
		form.set(
			"new-image-url",
			// URL
			//"https://cdn.discordapp.com/emojis/859084460489965598.webp?size=240&quality=lossless"
			url
		);

		xhr.open("POST", "https://ezgif.com/webp-to-png", true);
		xhr.onload = function () {
			if (this.readyState == XMLHttpRequest.DONE) {
				// https://ezgif.com/webp-to-png/ezgif-4-8525940e52.webp
				const redirect_location = this.responseURL;
				// console.log(redirect_location);

				// cancel the request
				// this.abort();

				const xhr = new XMLHttpRequest();
				const file_name = redirect_location.split("/").at(-1) as string;

				const form2 = new FormData();

				form2.set("file", file_name);
				form2.set("ajax", "true");

				xhr.onreadystatechange = null;

				xhr.open("POST", redirect_location + "?ajax=true", true);
				xhr.responseType = "document";

				xhr.onload = function () {
					if (this.status === 200) {
						const src = (this.response as Document).querySelector("img")?.src;
						if (!src) {
							reject(new Error("Image not found"));
							return;
						}
						const xhr = new XMLHttpRequest();
						xhr.open("GET", src, true);
						xhr.responseType = "blob";

						xhr.onload = function () {
							if (this.status === 200) {
								const blob = this.response;
								// we use blob url since ezgif expires
								resolve(URL.createObjectURL(blob));
							}
						};
						xhr.send();
					} else {
						reject(new Error(this.statusText));
					}
				};
				xhr.send(form2);
			}
		};

		xhr.send(form);
	});
}
