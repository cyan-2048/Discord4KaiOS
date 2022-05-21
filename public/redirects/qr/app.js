window.addEventListener(
	"DOMContentLoaded",
	function () {
		var activityHandler = null;
		var canvas = document.createElement("canvas");
		var video = document.querySelector("video");
		var canvasContext = canvas.getContext("2d");

		setInterval(capture, 200);

		video.width = window.innerWidth;
		video.height = video.parentElement.clientHeight;

		navigator.mozSetMessageHandler("activity", function (activityRequest) {
			activityHandler = activityRequest;
		});
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

		if (navigator.getUserMedia) {
			navigator.getUserMedia(
				{
					audio: false,
					video: {
						width: 200,
						height: 200,
					},
				},
				function (stream) {
					video.srcObject = stream;
					video.onloadedmetadata = function (e) {
						video.play();
					};
				},
				function (err) {
					console.error(err);
					console.log("The following error occurred: " + err.name);
				}
			);
		} else {
			console.log("getUserMedia not supported");
		}

		function capture() {
			if (video.readyState === video.HAVE_ENOUGH_DATA) {
				canvas.height = video.videoHeight;
				canvas.width = video.videoWidth;
				canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
				var imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
				var code = jsQR(imageData.data, imageData.width, imageData.height, {
					inversionAttempts: "dontInvert",
				});
				if (code) {
					activityHandler.postResult(code.data);
				}
			}
		}

		window.addEventListener("keydown", function (e) {
			switch (e.key) {
				case "SoftRight":
					activityHandler.postError("No QR Code");
					break;
			}
		});
	},
	false
);
