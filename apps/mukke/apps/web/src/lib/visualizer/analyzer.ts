/**
 * Audio Analyzer - connects Web Audio API AnalyserNode to the player's Audio element.
 *
 * Singleton: one AudioContext and AnalyserNode shared by all visualizer components.
 * The MediaElementSource can only be created once per Audio element, so we cache it.
 */

let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let connectedElement: HTMLAudioElement | null = null;

export interface AnalyzerConfig {
	fftSize?: number;
	smoothingTimeConstant?: number;
	minDecibels?: number;
	maxDecibels?: number;
}

const DEFAULT_CONFIG: Required<AnalyzerConfig> = {
	fftSize: 256,
	smoothingTimeConstant: 0.8,
	minDecibels: -90,
	maxDecibels: -10,
};

/**
 * Connect the analyzer to an HTMLAudioElement.
 * Safe to call multiple times — only creates nodes once per element.
 */
export function connectAnalyzer(
	audio: HTMLAudioElement,
	config: AnalyzerConfig = {}
): AnalyserNode {
	const cfg = { ...DEFAULT_CONFIG, ...config };

	if (!audioContext) {
		audioContext = new AudioContext();
	}

	if (!analyserNode) {
		analyserNode = audioContext.createAnalyser();
	}

	analyserNode.fftSize = cfg.fftSize;
	analyserNode.smoothingTimeConstant = cfg.smoothingTimeConstant;
	analyserNode.minDecibels = cfg.minDecibels;
	analyserNode.maxDecibels = cfg.maxDecibels;

	// Only create a source node once per audio element
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

/**
 * Get the current AnalyserNode (null if not yet connected).
 */
export function getAnalyzer(): AnalyserNode | null {
	return analyserNode;
}

/**
 * Get the AudioContext (null if not yet created).
 * Needed by Butterchurn for its own audio processing.
 */
export function getAudioContext(): AudioContext | null {
	return audioContext;
}

/**
 * Get the MediaElementAudioSourceNode (null if not yet connected).
 * Needed by Butterchurn to connect its own audio analysis.
 */
export function getSourceNode(): MediaElementAudioSourceNode | null {
	return sourceNode;
}

/**
 * Resume the AudioContext (required after user gesture on some browsers).
 */
export async function resumeAudioContext(): Promise<void> {
	if (audioContext?.state === 'suspended') {
		await audioContext.resume();
	}
}

/**
 * Get frequency data as a Uint8Array (0-255 per bin).
 * Returns null if analyzer is not connected.
 */
export function getFrequencyData(): Uint8Array | null {
	if (!analyserNode) return null;
	const data = new Uint8Array(analyserNode.frequencyBinCount);
	analyserNode.getByteFrequencyData(data);
	return data;
}

/**
 * Get the number of frequency bins (half of fftSize).
 */
export function getFrequencyBinCount(): number {
	return analyserNode?.frequencyBinCount ?? 0;
}
