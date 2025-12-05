import { writable } from 'svelte/store';
import type { ContentNode } from '$lib/types/content';

type AiMode = 'text' | 'image';
type ImageStyle = 'realistic' | 'fantasy' | 'anime' | 'concept-art' | 'illustration';

interface AiAuthorState {
	isVisible: boolean;
	currentNode: ContentNode | null;
	isOwner: boolean;
	mode: AiMode;
	imageGenerationState: {
		loading: boolean;
		generatedUrl: string | null;
		prompt: string;
		style: ImageStyle;
		error: string | null;
	};
}

function createAiAuthorStore() {
	const { subscribe, set, update } = writable<AiAuthorState>({
		isVisible: false,
		currentNode: null,
		isOwner: false,
		mode: 'text',
		imageGenerationState: {
			loading: false,
			generatedUrl: null,
			prompt: '',
			style: 'fantasy',
			error: null,
		},
	});

	return {
		subscribe,

		// Show bar with context
		show: (node: ContentNode, isOwner: boolean) => {
			update((state) => ({
				...state,
				isVisible: true,
				currentNode: node,
				isOwner,
			}));
		},

		// Hide bar
		hide: () => {
			update((state) => ({
				...state,
				isVisible: false,
			}));
		},

		// Toggle visibility (keeps current context)
		toggle: () => {
			update((state) => ({
				...state,
				isVisible: !state.isVisible,
			}));
		},

		// Update context without changing visibility
		setContext: (node: ContentNode, isOwner: boolean) => {
			update((state) => ({
				...state,
				currentNode: node,
				isOwner,
			}));
		},

		// Update node after AI edit
		updateNode: (updatedNode: ContentNode) => {
			update((state) => ({
				...state,
				currentNode: updatedNode,
			}));
		},

		// Switch mode
		setMode: (mode: AiMode) => {
			update((state) => ({
				...state,
				mode,
			}));
		},

		// Update image generation state
		setImageState: (imageState: Partial<AiAuthorState['imageGenerationState']>) => {
			update((state) => ({
				...state,
				imageGenerationState: {
					...state.imageGenerationState,
					...imageState,
				},
			}));
		},

		// Reset image generation state
		resetImageState: () => {
			update((state) => ({
				...state,
				imageGenerationState: {
					loading: false,
					generatedUrl: null,
					prompt: '',
					style: 'fantasy',
					error: null,
				},
			}));
		},
	};
}

export const aiAuthorStore = createAiAuthorStore();
