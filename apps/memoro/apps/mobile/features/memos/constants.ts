/**
 * Constants for the memos feature
 */

// Default memo titles
export const DEFAULT_MEMO_TITLES = {
  UNNAMED: 'Unbenanntes Memo',
  NEW_RECORDING: 'Neue Aufnahme',
};

// Database table names
export const DB_TABLES = {
  TAGS: 'tags',
  MEMO_TAGS: 'memo_tags',
  MEMO_SPACES: 'memo_spaces',
  SPACES: 'spaces',
};

// RPC function names
export const RPC_FUNCTIONS = {
  ADD_TAG_TO_MEMO: 'add_tag_to_memo',
};

// Processing status text
export const PROCESSING_STATUS_TEXT = {
  UPLOADING: 'Memo uploading...',
  TRANSCRIBING: 'Memo transcribing...',
  GENERATING_HEADLINE: 'Headline generating...',
  ERROR: 'Error processing memo',
};

// Context menu actions
export const CONTEXT_MENU_ACTIONS = [
  { title: 'Teilen', systemIcon: 'square.and.arrow.up' },
  { title: 'Kopieren', systemIcon: 'doc.on.doc' },
  { title: 'Transkript kopieren', systemIcon: 'text.bubble' },
  { title: 'An den Anfang pinnen', systemIcon: 'pin' },
  { title: 'Löschen', systemIcon: 'trash', destructive: true },
];

// Date formatting moved to ~/utils/sharedConstants.ts
