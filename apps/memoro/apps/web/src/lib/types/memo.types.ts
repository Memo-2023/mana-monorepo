export interface MemoPhoto {
	id: string;
	url: string;
	thumbnail_url?: string;
	caption?: string;
	created_at: string;
}

export interface AdditionalRecording {
	id: string;
	audio_url: string;
	duration_millis: number;
	created_at: string;
}

export interface Memo {
	id: string;
	user_id: string;
	title: string | null;
	intro: string | null;
	transcript: string | null;
	audio_url: string | null;
	duration_millis: number | null;
	created_at: string;
	updated_at: string;
	recorded_at?: string;
	space_id: string | null;
	blueprint_id: string | null;
	language: string | null;
	processing_status: ProcessingStatus;
	is_archived: boolean;
	is_pinned: boolean;
	is_public: boolean;
	location?: any;
	metadata?: Record<string, any> | null;
	source?: {
		type?: string;
		audio_path?: string;
		duration?: number;
		duration_seconds?: number;
		transcript?: string;
		transcription?: string;
		utterances?: Array<{
			text: string;
			offset?: number;
			duration?: number;
			speakerId?: string;
		}>;
		speakers?: Record<string, any>;
	};
	memories?: Memory[];
	tags?: Tag[];
	space?: Space;
	photos?: MemoPhoto[];
	additional_recordings?: AdditionalRecording[];
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Memory {
	id: string;
	memo_id: string;
	title: string;
	content: string | null;
	metadata?: Record<string, any> | null;
	style?: Record<string, any> | null;
	media?: Record<string, any> | null;
	created_at: string;
	updated_at: string;
}

export interface Tag {
	id: string;
	name: string;
	text?: string; // Backward compatibility
	color?: string | null; // Backward compatibility - direct color field
	style?: {
		color?: string;
		[key: string]: any;
	};
	user_id: string;
	created_at: string;
	is_pinned?: boolean;
	sort_order?: number;
	usage?: number;
}

export interface MemoTag {
	memo_id: string;
	tag_id: string;
}

export interface Space {
	id: string;
	name: string;
	description: string | null;
	owner_id: string;
	created_at: string;
	updated_at: string;
}

export interface Prompt {
	id: string;
	memory_title: string;
	prompt_text: string;
	name?: string;
	description?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface Blueprint {
	id: string;
	name: string;
	description: string | null;
	prompt?: string;
	user_id: string | null;
	is_public: boolean;
	created_at: string;
	updated_at?: string;
	category?: string | null;
	prompts?: Prompt[];
}
