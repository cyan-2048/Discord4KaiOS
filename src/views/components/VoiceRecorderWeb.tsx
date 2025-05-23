// taken from vencord uwu

// @ts-ignore
import clamp from "lodash-es/clamp";

import * as styles from "./VoiceRecorderWeb.module.scss";
import { pauseKeypress, resumeKeypress, useKeypress } from "@/lib/utils";
import { Show, createEffect, createSignal, onCleanup, onMount, untrack } from "solid-js";

function Timer(props: { time: number }) {
	return (
		<div class={styles.timer}>
			<span class="digits">{("0" + Math.floor((props.time / 60000) % 60)).slice(-2)}:</span>
			<span class="digits">{("0" + Math.floor((props.time / 1000) % 60)).slice(-2)}.</span>
			<span class="digits mili-sec">{("0" + ((props.time / 10) % 100)).slice(-2)}</span>
		</div>
	);
}

function blobToArrayBuffer(blob: Blob | File): Promise<ArrayBuffer> {
	if ("arrayBuffer" in blob) {
		return blob.arrayBuffer();
	}

	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			resolve(reader.result as ArrayBuffer);
		};
		reader.onerror = reject;
		reader.readAsArrayBuffer(blob);
	});
}

export const VoiceRecorderWeb = (props: {
	setAudioBlob: (blob: Blob, waveform: string, duration: number) => void;
	onRecordingChange?: (recording: boolean) => void;
	onSend: () => void;
	onCancel: () => void;
}) => {
	const [recording, setRecording] = createSignal(false);
	const [paused, setPaused] = createSignal(false);
	const [time, setTime] = createSignal(0);
	const [audioPreview, setAudioPreview] = createSignal<HTMLAudioElement | null>(null);

	let divRef!: HTMLDivElement;
	let recorder: MediaRecorder;
	let chunks = [] as Blob[];
	let currentStream: MediaStream;

	onMount(() => {
		pauseKeypress();
		divRef.focus();
	});

	onCleanup(() => {
		const _audioPreview = untrack(audioPreview);
		if (_audioPreview) {
			_audioPreview.pause();
			URL.revokeObjectURL(_audioPreview.src);
		}

		divRef.blur();
		resumeKeypress();
	});

	const changeRecording = (recording: boolean) => {
		setRecording(recording);
		props.onRecordingChange?.(recording);
	};

	function toggleRecording() {
		const nowRecording = !untrack(recording);

		if (nowRecording) {
			setTime(0);
			navigator.mediaDevices
				.getUserMedia({
					audio: {
						echoCancellation: true,
						noiseSuppression: true,
					},
				})
				.then((stream) => {
					currentStream = stream;
					const _chunks = [] as Blob[];
					chunks = _chunks;

					const _recorder = new MediaRecorder(stream);
					recorder = _recorder;
					_recorder.addEventListener("dataavailable", (e) => {
						_chunks.push(e.data);
					});
					_recorder.start();

					changeRecording(true);
				});
		} else {
			if (recorder) {
				recorder.addEventListener("stop", async () => {
					const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });

					const audioContext = new AudioContext();
					const audioBuffer = await audioContext.decodeAudioData(await blobToArrayBuffer(blob));
					const channelData = audioBuffer.getChannelData(0);

					// average the samples into much lower resolution bins, maximum of 256 total bins
					const bins = new Uint8Array(
						clamp(Math.floor(audioBuffer.duration * 10), Math.min(32, channelData.length), 256)
					);
					const samplesPerBin = Math.floor(channelData.length / bins.length);

					// Get root mean square of each bin
					for (let binIdx = 0; binIdx < bins.length; binIdx++) {
						let squares = 0;
						for (let sampleOffset = 0; sampleOffset < samplesPerBin; sampleOffset++) {
							const sampleIdx = binIdx * samplesPerBin + sampleOffset;
							squares += channelData[sampleIdx] ** 2;
						}
						bins[binIdx] = ~~(Math.sqrt(squares / samplesPerBin) * 0xff);
					}

					// Normalize bins with easing
					const maxBin = Math.max(...bins);
					const ratio = 1 + (0xff / maxBin - 1) * Math.min(1, 100 * (maxBin / 0xff) ** 3);
					for (let i = 0; i < bins.length; i++) bins[i] = Math.min(0xff, ~~(bins[i] * ratio));

					props.setAudioBlob(blob, btoa(String.fromCharCode(...bins)), audioBuffer.duration);
					changeRecording(false);
				});

				recorder.stop();
				currentStream?.getTracks().forEach((track) => track.stop());
			}
		}
	}

	createEffect(() => {
		let interval: Timer = undefined as any as Timer;

		const _recording = recording();
		const _paused = paused();

		if (_recording && _paused === false) {
			interval = setInterval(() => {
				setTime((time) => time + 10);
			}, 10);
		} else {
			clearInterval(interval);
		}

		onCleanup(() => {
			clearInterval(interval);
		});
	});

	return (
		<div
			class={styles.recorder}
			onKeyDown={(e) => {
				if (e.currentTarget !== divRef) return;
				if (e.currentTarget !== document.activeElement) return;

				switch (e.key) {
					case "Backspace":
						props.onCancel();
						break;
					case "SoftRight":
						{
							if (untrack(recording)) {
								toggleRecording();
							}
							if (!untrack(recording) && !!untrack(time)) {
								props.onSend();
							}
						}
						break;
					case "Enter": {
						if (untrack(recording)) {
							if (untrack(paused)) recorder?.resume();
							else recorder?.pause();
							setPaused((a) => !a);
						} else {
							toggleRecording();
						}
						break;
					}
					case "SoftLeft": {
						if (!untrack(recording) && !!untrack(time)) {
							const _audioPreview = untrack(audioPreview);
							if (_audioPreview) {
								_audioPreview.pause();
								URL.revokeObjectURL(_audioPreview.src);
								setAudioPreview(null);
							} else {
								const audio = new Audio(
									URL.createObjectURL(new Blob(chunks, { type: "audio/ogg; codecs=opus" }))
								);
								audio.play();
								audio.onended = () => {
									URL.revokeObjectURL(audio.src);
									setAudioPreview(null);
								};
								setAudioPreview(audio);
							}
						}
						break;
					}
				}
			}}
			ref={divRef}
			tabIndex={-1}
		>
			<Timer time={time()} />
			<div class={styles.bar}>
				<div>
					<Show when={!audioPreview() && !recording() && !!time()}>
						<span>Preview</span>
					</Show>
					<Show when={audioPreview()}>
						<span>Stop</span>
					</Show>
				</div>

				<div>
					<span>
						<Show when={recording()} fallback={"Record"}>
							{paused() ? "Resume" : "Pause"}
						</Show>
					</span>
				</div>

				<div>
					<Show when={recording()}>
						<span>Stop</span>
					</Show>
					<Show when={!recording() && !!time()}>
						<span>Send</span>
					</Show>
				</div>
			</div>
		</div>
	);
};
