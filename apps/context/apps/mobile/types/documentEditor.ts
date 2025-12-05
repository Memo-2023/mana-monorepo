import { Document } from '~/services/supabaseService';

export type DocumentMode = 'edit' | 'preview';

export interface DocumentEditorState {
	// Document data
	document: Document | null;
	title: string;
	content: string;
	tags: string[];

	// UI state
	mode: DocumentMode;
	showTagsEditor: boolean;
	showVariantCreator: boolean;
	showNextDocumentPreview: boolean;
	fadeIn: boolean;

	// Status
	loading: boolean;
	saving: boolean;
	error: string | null;
	unsavedChanges: boolean;

	// Navigation
	spaceDocuments: Document[];
	nextDocument: Document | null;
	spaceName: string;

	// AI
	isGeneratingText: boolean;
}

export type DocumentEditorAction =
	| { type: 'SET_DOCUMENT'; payload: Document }
	| { type: 'SET_TITLE'; payload: string }
	| { type: 'SET_CONTENT'; payload: string }
	| { type: 'SET_TAGS'; payload: string[] }
	| { type: 'SET_MODE'; payload: DocumentMode }
	| { type: 'TOGGLE_MODE' }
	| { type: 'SET_SHOW_TAGS_EDITOR'; payload: boolean }
	| { type: 'SET_SHOW_VARIANT_CREATOR'; payload: boolean }
	| { type: 'SET_SHOW_NEXT_DOCUMENT_PREVIEW'; payload: boolean }
	| { type: 'SET_FADE_IN'; payload: boolean }
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_SAVING'; payload: boolean }
	| { type: 'SET_ERROR'; payload: string | null }
	| { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
	| { type: 'SET_SPACE_DOCUMENTS'; payload: Document[] }
	| { type: 'SET_NEXT_DOCUMENT'; payload: Document | null }
	| { type: 'SET_SPACE_NAME'; payload: string }
	| { type: 'SET_IS_GENERATING_TEXT'; payload: boolean }
	| { type: 'RESET_STATE' };

export const initialDocumentEditorState: DocumentEditorState = {
	document: null,
	title: '',
	content: '',
	tags: [],
	mode: 'edit',
	showTagsEditor: false,
	showVariantCreator: false,
	showNextDocumentPreview: false,
	fadeIn: false,
	loading: true,
	saving: false,
	error: null,
	unsavedChanges: false,
	spaceDocuments: [],
	nextDocument: null,
	spaceName: '',
	isGeneratingText: false,
};

export function documentEditorReducer(
	state: DocumentEditorState,
	action: DocumentEditorAction
): DocumentEditorState {
	switch (action.type) {
		case 'SET_DOCUMENT':
			return {
				...state,
				document: action.payload,
				title: action.payload.title,
				content: action.payload.content,
				tags: action.payload.metadata?.tags || [],
				unsavedChanges: false,
			};

		case 'SET_TITLE':
			return {
				...state,
				title: action.payload,
				unsavedChanges: state.title !== action.payload,
			};

		case 'SET_CONTENT':
			return {
				...state,
				content: action.payload,
				unsavedChanges: state.content !== action.payload,
			};

		case 'SET_TAGS':
			return {
				...state,
				tags: action.payload,
				unsavedChanges: JSON.stringify(state.tags) !== JSON.stringify(action.payload),
			};

		case 'SET_MODE':
			return {
				...state,
				mode: action.payload,
			};

		case 'TOGGLE_MODE':
			return {
				...state,
				mode: state.mode === 'edit' ? 'preview' : 'edit',
			};

		case 'SET_SHOW_TAGS_EDITOR':
			return {
				...state,
				showTagsEditor: action.payload,
			};

		case 'SET_SHOW_VARIANT_CREATOR':
			return {
				...state,
				showVariantCreator: action.payload,
			};

		case 'SET_SHOW_NEXT_DOCUMENT_PREVIEW':
			return {
				...state,
				showNextDocumentPreview: action.payload,
			};

		case 'SET_FADE_IN':
			return {
				...state,
				fadeIn: action.payload,
			};

		case 'SET_LOADING':
			return {
				...state,
				loading: action.payload,
			};

		case 'SET_SAVING':
			return {
				...state,
				saving: action.payload,
			};

		case 'SET_ERROR':
			return {
				...state,
				error: action.payload,
			};

		case 'SET_UNSAVED_CHANGES':
			return {
				...state,
				unsavedChanges: action.payload,
			};

		case 'SET_SPACE_DOCUMENTS':
			return {
				...state,
				spaceDocuments: action.payload,
			};

		case 'SET_NEXT_DOCUMENT':
			return {
				...state,
				nextDocument: action.payload,
			};

		case 'SET_SPACE_NAME':
			return {
				...state,
				spaceName: action.payload,
			};

		case 'SET_IS_GENERATING_TEXT':
			return {
				...state,
				isGeneratingText: action.payload,
			};

		case 'RESET_STATE':
			return initialDocumentEditorState;

		default:
			return state;
	}
}
