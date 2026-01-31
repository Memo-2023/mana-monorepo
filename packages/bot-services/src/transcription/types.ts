/**
 * Types for Speech-to-Text transcription service
 */

export interface SttResponse {
	text: string;
	language?: string;
	model?: string;
	duration?: number;
}

export interface TranscriptionOptions {
	language?: string;
	model?: string;
}

export interface TranscriptionModuleOptions {
	sttUrl?: string;
	defaultLanguage?: string;
}

export const STT_MODULE_OPTIONS = 'STT_MODULE_OPTIONS';
