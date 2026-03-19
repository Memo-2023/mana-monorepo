interface AudioState {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	isLoaded: boolean;
	bpm: number | null;
	audioUrl: string | null;
}

function createAudioStore() {
	let state = $state<AudioState>({
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		isLoaded: false,
		bpm: null,
		audioUrl: null,
	});

	return {
		get isPlaying() {
			return state.isPlaying;
		},
		get currentTime() {
			return state.currentTime;
		},
		get duration() {
			return state.duration;
		},
		get isLoaded() {
			return state.isLoaded;
		},
		get bpm() {
			return state.bpm;
		},
		get audioUrl() {
			return state.audioUrl;
		},

		setPlaying(playing: boolean) {
			state.isPlaying = playing;
		},

		setCurrentTime(time: number) {
			state.currentTime = time;
		},

		setDuration(duration: number) {
			state.duration = duration;
		},

		setLoaded(loaded: boolean) {
			state.isLoaded = loaded;
		},

		setBpm(bpm: number | null) {
			state.bpm = bpm;
		},

		setAudioUrl(url: string | null) {
			state.audioUrl = url;
			if (!url) {
				state.isLoaded = false;
				state.duration = 0;
				state.currentTime = 0;
				state.isPlaying = false;
			}
		},

		reset() {
			state.isPlaying = false;
			state.currentTime = 0;
			state.duration = 0;
			state.isLoaded = false;
			state.bpm = null;
			state.audioUrl = null;
		},
	};
}

export const audioStore = createAudioStore();
