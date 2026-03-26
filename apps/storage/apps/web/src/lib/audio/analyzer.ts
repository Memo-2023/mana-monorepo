/**
 * Audio Analyzer - connects Web Audio API AnalyserNode to the player's Audio element.
 * Singleton: one AudioContext and AnalyserNode shared by all visualizer components.
 */

let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let connectedElement: HTMLAudioElement | null = null;

export function connectAnalyzer(audio: HTMLAudioElement): AnalyserNode {
	if (!audioContext) {
		audioContext = new AudioContext();
	}

	if (!analyserNode) {
		analyserNode = audioContext.createAnalyser();
	}

	analyserNode.fftSize = 256;
	analyserNode.smoothingTimeConstant = 0.8;
	analyserNode.minDecibels = -90;
	analyserNode.maxDecibels = -10;

	if (connectedElement !== audio) {
		if (sourceNode) {
			sourceNode.disconnect();
		}
		sourceNode = audioContext.createMediaElementSource(audio);
		sourceNode.connect(analyserNode);
		analyserNode.connect(audioContext.destination);
		connectedElement = audio;
	}

	return analyserNode;
}

export async function resumeAudioContext(): Promise<void> {
	if (audioContext?.state === 'suspended') {
		await audioContext.resume();
	}
}

export function getFrequencyData(): Uint8Array | null {
	if (!analyserNode) return null;
	const data = new Uint8Array(analyserNode.frequencyBinCount);
	analyserNode.getByteFrequencyData(data);
	return data;
}
