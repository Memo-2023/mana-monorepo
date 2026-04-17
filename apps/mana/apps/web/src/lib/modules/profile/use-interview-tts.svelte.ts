/**
 * useInterviewTts() — Plays pre-rendered interview question audio.
 *
 * Audio files live in /audio/interview/{voiceKey}/{questionId}.mp3
 * where voiceKey is one of: de-f, de-m, ch-f, ch-m
 *
 * Falls back to Web Speech API if the audio file is missing.
 */

export type VoiceKey = 'de-f' | 'de-m' | 'ch-f' | 'ch-m';

export interface VoiceMeta {
	key: VoiceKey;
	label: string;
	lang: string;
	gender: string;
}

export const VOICES: VoiceMeta[] = [
	{ key: 'de-f', label: 'Seraphina (DE)', lang: 'Deutsch', gender: 'Weiblich' },
	{ key: 'de-m', label: 'Florian (DE)', lang: 'Deutsch', gender: 'Männlich' },
	{ key: 'ch-f', label: 'Leni (CH)', lang: 'Schweizerdeutsch', gender: 'Weiblich' },
	{ key: 'ch-m', label: 'Jan (CH)', lang: 'Schweizerdeutsch', gender: 'Männlich' },
];

const STORAGE_KEY = 'mana.interview.voice';
const DEFAULT_VOICE: VoiceKey = 'de-f';

export interface InterviewTtsHandle {
	/** Whether audio is currently playing */
	readonly speaking: boolean;
	/** Always true — we have pre-rendered audio */
	readonly isSupported: boolean;
	/** Currently selected voice */
	readonly voice: VoiceKey;
	/** Set the voice */
	setVoice: (key: VoiceKey) => void;
	/** Play the audio for a question. Resolves when done. */
	speak: (questionId: string, fallbackText?: string) => Promise<void>;
	/** Stop playback immediately. */
	stop: () => void;
}

export function useInterviewTts(): InterviewTtsHandle {
	let speaking = $state(false);
	let voice = $state<VoiceKey>(loadVoice());
	let currentAudio: HTMLAudioElement | null = null;

	function loadVoice(): VoiceKey {
		if (typeof window === 'undefined') return DEFAULT_VOICE;
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && VOICES.some((v) => v.key === stored)) return stored as VoiceKey;
		return DEFAULT_VOICE;
	}

	function setVoice(key: VoiceKey) {
		voice = key;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, key);
		}
	}

	function speak(questionId: string, fallbackText?: string): Promise<void> {
		stop();

		const audioUrl = `/audio/interview/${voice}/${questionId}.mp3`;

		return new Promise<void>((resolve) => {
			const audio = new Audio(audioUrl);
			currentAudio = audio;

			audio.addEventListener(
				'canplaythrough',
				() => {
					speaking = true;
					audio.play().catch(() => {
						// Autoplay blocked — try Web Speech API fallback
						speaking = false;
						if (fallbackText) {
							speakFallback(fallbackText).then(resolve);
						} else {
							resolve();
						}
					});
				},
				{ once: true }
			);

			audio.addEventListener(
				'ended',
				() => {
					speaking = false;
					currentAudio = null;
					resolve();
				},
				{ once: true }
			);

			audio.addEventListener(
				'error',
				() => {
					// File not found — fallback to Web Speech API
					speaking = false;
					currentAudio = null;
					if (fallbackText) {
						speakFallback(fallbackText).then(resolve);
					} else {
						resolve();
					}
				},
				{ once: true }
			);

			audio.load();
		});
	}

	function stop() {
		if (currentAudio) {
			currentAudio.pause();
			currentAudio.src = '';
			currentAudio = null;
		}
		speaking = false;
	}

	return {
		get speaking() {
			return speaking;
		},
		get isSupported() {
			return true;
		},
		get voice() {
			return voice;
		},
		setVoice,
		speak,
		stop,
	};
}

/** Web Speech API fallback for missing audio files. */
function speakFallback(text: string): Promise<void> {
	if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
		return Promise.resolve();
	}

	speechSynthesis.cancel();

	return new Promise<void>((resolve) => {
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'de-DE';
		utterance.rate = 0.92;
		utterance.onend = () => resolve();
		utterance.onerror = () => resolve();
		speechSynthesis.speak(utterance);
	});
}
