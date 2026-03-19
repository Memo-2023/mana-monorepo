/**
 * BPM Detection using Web Audio API
 * Uses peak detection algorithm for BPM estimation
 *
 * Note: For more accurate results, consider using essentia.js WASM module
 * This implementation provides a lightweight fallback
 */

interface BpmResult {
	bpm: number;
	confidence: number;
}

/**
 * Detect BPM from an audio buffer
 */
export async function detectBpm(audioBuffer: AudioBuffer): Promise<BpmResult> {
	// Get audio data from the first channel
	const channelData = audioBuffer.getChannelData(0);
	const sampleRate = audioBuffer.sampleRate;

	// Downsample for efficiency
	const downsampleFactor = 4;
	const downsampled = downsample(channelData, downsampleFactor);
	const effectiveSampleRate = sampleRate / downsampleFactor;

	// Apply low-pass filter to focus on bass frequencies (kick drum)
	const filtered = lowPassFilter(downsampled, effectiveSampleRate, 150);

	// Detect peaks
	const peaks = detectPeaks(filtered, effectiveSampleRate);

	// Calculate intervals between peaks
	const intervals = calculateIntervals(peaks, effectiveSampleRate);

	// Estimate BPM from intervals
	const result = estimateBpm(intervals);

	return result;
}

/**
 * Detect BPM from a File object
 */
export async function detectBpmFromFile(file: File): Promise<BpmResult> {
	const arrayBuffer = await file.arrayBuffer();
	const audioContext = new AudioContext();
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	const result = await detectBpm(audioBuffer);
	await audioContext.close();
	return result;
}

/**
 * Detect BPM from a URL
 */
export async function detectBpmFromUrl(url: string): Promise<BpmResult> {
	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer();
	const audioContext = new AudioContext();
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	const result = await detectBpm(audioBuffer);
	await audioContext.close();
	return result;
}

function downsample(data: Float32Array, factor: number): Float32Array {
	const length = Math.floor(data.length / factor);
	const result = new Float32Array(length);
	for (let i = 0; i < length; i++) {
		result[i] = data[i * factor];
	}
	return result;
}

function lowPassFilter(data: Float32Array, sampleRate: number, cutoff: number): Float32Array {
	const rc = 1.0 / (cutoff * 2 * Math.PI);
	const dt = 1.0 / sampleRate;
	const alpha = dt / (rc + dt);

	const result = new Float32Array(data.length);
	result[0] = data[0];

	for (let i = 1; i < data.length; i++) {
		result[i] = result[i - 1] + alpha * (data[i] - result[i - 1]);
	}

	return result;
}

function detectPeaks(data: Float32Array, sampleRate: number): number[] {
	const peaks: number[] = [];
	const minPeakDistance = Math.floor(sampleRate * 0.2); // Min 200ms between peaks (300 BPM max)

	// Calculate threshold as percentage of max amplitude
	let maxAmplitude = 0;
	for (let i = 0; i < data.length; i++) {
		const abs = Math.abs(data[i]);
		if (abs > maxAmplitude) maxAmplitude = abs;
	}
	const threshold = maxAmplitude * 0.5;

	let lastPeak = -minPeakDistance;

	for (let i = 1; i < data.length - 1; i++) {
		if (i - lastPeak < minPeakDistance) continue;

		const current = Math.abs(data[i]);
		const prev = Math.abs(data[i - 1]);
		const next = Math.abs(data[i + 1]);

		if (current > threshold && current > prev && current > next) {
			peaks.push(i);
			lastPeak = i;
		}
	}

	return peaks;
}

function calculateIntervals(peaks: number[], sampleRate: number): number[] {
	const intervals: number[] = [];

	for (let i = 1; i < peaks.length; i++) {
		const interval = (peaks[i] - peaks[i - 1]) / sampleRate;
		// Filter to reasonable BPM range (60-200 BPM = 0.3-1.0 seconds)
		if (interval >= 0.3 && interval <= 1.0) {
			intervals.push(interval);
		}
	}

	return intervals;
}

function estimateBpm(intervals: number[]): BpmResult {
	if (intervals.length === 0) {
		return { bpm: 120, confidence: 0 };
	}

	// Group intervals into buckets and find the most common
	const bucketSize = 0.02; // 20ms buckets
	const buckets: Map<number, number[]> = new Map();

	for (const interval of intervals) {
		const bucket = Math.round(interval / bucketSize) * bucketSize;
		if (!buckets.has(bucket)) {
			buckets.set(bucket, []);
		}
		buckets.get(bucket)!.push(interval);
	}

	// Find the bucket with most intervals
	let maxCount = 0;
	let bestBucket = 0.5;
	let bestIntervals: number[] = [];

	for (const [bucket, bucketIntervals] of buckets) {
		if (bucketIntervals.length > maxCount) {
			maxCount = bucketIntervals.length;
			bestBucket = bucket;
			bestIntervals = bucketIntervals;
		}
	}

	// Calculate average interval from best bucket
	const avgInterval = bestIntervals.reduce((a, b) => a + b, 0) / bestIntervals.length;
	const bpm = Math.round(60 / avgInterval);

	// Calculate confidence based on how many intervals fell into the best bucket
	const confidence = Math.min(1, (maxCount / intervals.length) * 2);

	// Ensure BPM is in reasonable range
	let finalBpm = bpm;
	if (finalBpm < 60) finalBpm *= 2;
	if (finalBpm > 200) finalBpm /= 2;

	return {
		bpm: Math.round(finalBpm),
		confidence: Math.round(confidence * 100) / 100,
	};
}

/**
 * Snap a time value to the nearest beat based on BPM
 */
export function snapToBeat(time: number, bpm: number, offset: number = 0): number {
	const beatDuration = 60 / bpm;
	const adjustedTime = time - offset;
	const nearestBeat = Math.round(adjustedTime / beatDuration) * beatDuration;
	return nearestBeat + offset;
}

/**
 * Get beat times within a range
 */
export function getBeatTimes(
	startTime: number,
	endTime: number,
	bpm: number,
	offset: number = 0
): number[] {
	const beatDuration = 60 / bpm;
	const beats: number[] = [];

	const firstBeat = Math.ceil((startTime - offset) / beatDuration) * beatDuration + offset;

	for (let beat = firstBeat; beat <= endTime; beat += beatDuration) {
		beats.push(beat);
	}

	return beats;
}

/**
 * Get bar (measure) times within a range (assuming 4/4 time)
 */
export function getBarTimes(
	startTime: number,
	endTime: number,
	bpm: number,
	offset: number = 0,
	beatsPerBar: number = 4
): number[] {
	const barDuration = (60 / bpm) * beatsPerBar;
	const bars: number[] = [];

	const firstBar = Math.ceil((startTime - offset) / barDuration) * barDuration + offset;

	for (let bar = firstBar; bar <= endTime; bar += barDuration) {
		bars.push(bar);
	}

	return bars;
}
