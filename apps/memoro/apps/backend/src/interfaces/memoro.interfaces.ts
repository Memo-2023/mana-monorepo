export interface MemoroSpaceDto {
	id: string;
	name: string;
	owner_id: string;
	app_id: string;
	roles: any;
	credits: number;
	created_at: string;
	updated_at: string;
	memo_count?: number;
	isOwner?: boolean; // Added for frontend ownership indication
}

export interface LinkMemoSpaceDto {
	memoId: string;
	spaceId: string;
}

export interface UnlinkMemoSpaceDto {
	memoId: string;
	spaceId: string;
}

export interface SuccessResponseDto {
	success: boolean;
	message?: string;
}

// Video-related interfaces
export interface VideoMetadata {
	width?: number;
	height?: number;
	fps?: number;
	videoCodec?: string;
	audioCodec?: string;
	audioChannels?: number;
	audioSampleRate?: number;
	fileSize?: number;
	bitrate?: number;
	hasAudioTrack?: boolean;
}

export type MediaType = 'audio' | 'video';

export interface ProcessMediaDto {
	filePath: string;
	duration: number;
	spaceId?: string;
	blueprintId?: string | null;
	recordingLanguages?: string[];
	memoId?: string;
	location?: any;
	recordingStartedAt?: string;
	enableDiarization?: boolean;
	mediaType?: MediaType;
	videoMetadata?: VideoMetadata;
}
