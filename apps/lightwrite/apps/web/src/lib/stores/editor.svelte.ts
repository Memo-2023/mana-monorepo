import type { MarkerType } from '@lightwrite/shared';

type EditorMode = 'edit' | 'preview';
type SyncMode = 'line' | 'word';

interface EditorState {
	mode: EditorMode;
	syncMode: SyncMode;
	selectedMarkerId: string | null;
	selectedLineIndex: number | null;
	isRecordingTimestamps: boolean;
	zoom: number;
	scrollPosition: number;
	markerTypeToCreate: MarkerType;
	snapToBeat: boolean;
	showWaveform: boolean;
	showMarkers: boolean;
	showLyrics: boolean;
	loopRegionId: string | null;
	isLooping: boolean;
}

function createEditorStore() {
	let state = $state<EditorState>({
		mode: 'edit',
		syncMode: 'line',
		selectedMarkerId: null,
		selectedLineIndex: null,
		isRecordingTimestamps: false,
		zoom: 1,
		scrollPosition: 0,
		markerTypeToCreate: 'verse',
		snapToBeat: true,
		showWaveform: true,
		showMarkers: true,
		showLyrics: true,
		loopRegionId: null,
		isLooping: false,
	});

	return {
		get mode() {
			return state.mode;
		},
		get syncMode() {
			return state.syncMode;
		},
		get selectedMarkerId() {
			return state.selectedMarkerId;
		},
		get selectedLineIndex() {
			return state.selectedLineIndex;
		},
		get isRecordingTimestamps() {
			return state.isRecordingTimestamps;
		},
		get zoom() {
			return state.zoom;
		},
		get scrollPosition() {
			return state.scrollPosition;
		},
		get markerTypeToCreate() {
			return state.markerTypeToCreate;
		},
		get snapToBeat() {
			return state.snapToBeat;
		},
		get showWaveform() {
			return state.showWaveform;
		},
		get showMarkers() {
			return state.showMarkers;
		},
		get showLyrics() {
			return state.showLyrics;
		},
		get loopRegionId() {
			return state.loopRegionId;
		},
		get isLooping() {
			return state.isLooping;
		},

		setMode(mode: EditorMode) {
			state.mode = mode;
		},

		setSyncMode(syncMode: SyncMode) {
			state.syncMode = syncMode;
		},

		selectMarker(markerId: string | null) {
			state.selectedMarkerId = markerId;
		},

		selectLine(lineIndex: number | null) {
			state.selectedLineIndex = lineIndex;
		},

		setRecordingTimestamps(recording: boolean) {
			state.isRecordingTimestamps = recording;
		},

		setZoom(zoom: number) {
			state.zoom = Math.max(0.5, Math.min(10, zoom));
		},

		zoomIn() {
			state.zoom = Math.min(10, state.zoom * 1.25);
		},

		zoomOut() {
			state.zoom = Math.max(0.5, state.zoom / 1.25);
		},

		setScrollPosition(position: number) {
			state.scrollPosition = position;
		},

		setMarkerTypeToCreate(type: MarkerType) {
			state.markerTypeToCreate = type;
		},

		toggleSnapToBeat() {
			state.snapToBeat = !state.snapToBeat;
		},

		toggleWaveform() {
			state.showWaveform = !state.showWaveform;
		},

		toggleMarkers() {
			state.showMarkers = !state.showMarkers;
		},

		toggleLyrics() {
			state.showLyrics = !state.showLyrics;
		},

		setLoopRegion(markerId: string | null) {
			state.loopRegionId = markerId;
			state.isLooping = markerId !== null;
		},

		reset() {
			state.mode = 'edit';
			state.syncMode = 'line';
			state.selectedMarkerId = null;
			state.selectedLineIndex = null;
			state.isRecordingTimestamps = false;
			state.zoom = 1;
			state.scrollPosition = 0;
			state.loopRegionId = null;
			state.isLooping = false;
		},
	};
}

export const editorStore = createEditorStore();
