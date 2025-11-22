/**
 * Memo type definitions
 */

import { WithId, Timestamps } from '~/features/core/types';

/**
 * Processing status types
 */
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Memo source types
 */
export type MemoSourceType = 'audio' | 'text' | 'upload' | 'photo';

/**
 * Speaker utterance
 */
export interface SpeakerUtterance {
  text: string;
  offset?: number;
  duration?: number;
  speakerId?: string;
}

/**
 * Memo source
 */
export interface MemoSource {
  type?: MemoSourceType;
  content?: string;
  transcript?: string;
  transcription?: string;
  speakers?: Record<string, string>; // Simple speaker name mapping (e.g., "speaker1": "Speaker 1")
  utterances?: SpeakerUtterance[];
  duration?: number;
  duration_seconds?: number;
  audio_path?: string;
  languages?: string[];
  primary_language?: string;
  additional_recordings?: AdditionalRecording[];
}

/**
 * Additional recording
 */
export interface AdditionalRecording {
  path: string;
  type: string;
  timestamp: string;
  status: string;
  transcript?: string;
  speakers?: Record<string, string>; // Simple speaker name mapping (e.g., "speaker1": "Speaker 1")
  utterances?: SpeakerUtterance[]; // Chronological utterances array
  languages?: string[];
  primary_language?: string;
  updated_at?: string;
}

/**
 * Processing metadata
 */
export interface ProcessingMetadata {
  transcription?: {
    status?: ProcessingStatus;
    timestamp?: string;
  };
  headline?: {
    status?: ProcessingStatus;
    timestamp?: string;
  };
  headline_and_intro?: {
    status?: ProcessingStatus;
    updated_at?: string;
  };
}

/**
 * Memo metadata
 */
export interface MemoMetadata {
  processing?: ProcessingMetadata;
  transcriptionStatus?: string;
  recordingStatus?: string;
  recordingStartedAt?: string;
  blueprintId?: string | null;
  blueprint_id?: string;
  speakerLabels?: Record<string, string>;
  transcript?: string;
  utterances?: SpeakerUtterance[];
  audioFileId?: string; // ID of the audio file for upload status tracking
  location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  stats?: {
    viewCount: number;
    wordCount?: number;
    lastViewed?: string;
    audioDuration?: number;
  };
}

/**
 * Tag
 */
export interface Tag {
  id: string;
  text: string;
  color: string;
}

/**
 * Space reference
 */
export interface SpaceReference {
  id: string;
  name: string;
  color?: string;
}

/**
 * Memory
 */
export interface Memory extends WithId, Timestamps {
  title: string;
  content: string;
  memo_id: string;
  user_id: string;
  is_public?: boolean;
  is_archived?: boolean;
  created_by?: string;
  prompt_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Main Memo type
 */
export interface Memo extends WithId, Timestamps {
  title: string;
  intro?: string;
  user_id: string;
  source?: MemoSource;
  transcript?: string; // Full transcription text (moved from source for performance)
  metadata?: MemoMetadata;
  style?: Record<string, unknown>;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_public?: boolean;
  tags?: Tag[];
  space?: SpaceReference;
  space_id?: string;
  memories?: Memory[];
  location?: string; // PostGIS POINT format: "POINT(longitude latitude)"
}

/**
 * Memo creation data
 */
export interface MemoCreateData {
  title: string;
  source?: Partial<MemoSource>;
  metadata?: Partial<MemoMetadata>;
  space_id?: string;
  tags?: string[];
}

/**
 * Memo update data
 */
export interface MemoUpdateData {
  title?: string;
  intro?: string;
  source?: Partial<MemoSource>;
  metadata?: Partial<MemoMetadata>;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_public?: boolean;
  tags?: string[];
  space_id?: string | null;
}