export interface Beat {
	id: string;
	projectId: string;
	storagePath: string;
	filename?: string | null;
	duration?: number | null;
	bpm?: number | null;
	bpmConfidence?: number | null;
	waveformData?: WaveformData | null;
	createdAt: Date;
}

export interface WaveformData {
	peaks: number[];
	sampleRate: number;
	duration: number;
}

export interface CreateBeatDto {
	projectId: string;
	filename: string;
}

export interface UpdateBeatDto {
	bpm?: number;
	bpmConfidence?: number;
	duration?: number;
	waveformData?: WaveformData;
}

export interface BeatUploadResponse {
	beat: Beat;
	uploadUrl: string;
}
