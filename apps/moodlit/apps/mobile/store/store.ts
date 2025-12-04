import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnimationType =
	| 'gradient'
	| 'pulse'
	| 'wave'
	| 'flash'
	| 'sos'
	| 'candle'
	| 'police'
	| 'warning'
	| 'disco'
	| 'thunder'
	| 'breath'
	| 'rave'
	| 'scanner'
	| 'matrix'
	| 'sunrise'
	| 'sunset';

export interface Mood {
	id: string;
	name: string;
	colors: string[];
	animationType: AnimationType;
	isFavorite?: boolean;
	isCustom?: boolean;
}

export interface MoodSequenceItem {
	moodId: string;
	duration: number; // in Sekunden
}

export interface MoodSequence {
	id: string;
	name: string;
	items: MoodSequenceItem[];
	transitionDuration: number; // in Sekunden (2, 5, oder 10)
	isCustom: boolean;
}

export interface Settings {
	animationSpeed: number; // 0.5 = langsam, 1 = normal, 2 = schnell
	hapticFeedback: boolean;
	brightness: number; // 0-1 (Bildschirm-Helligkeit)
	autoTimer: number; // 0 = aus, sonst Minuten
	autoMoodSwitch: boolean;
	autoMoodSwitchInterval: number; // Minuten
	screenEnabled: boolean; // Bildschirm-Animation aktiviert
	flashlightEnabled: boolean; // Taschenlampe aktiviert
	flashlightBrightness: number; // 1-10 (Taschenlampen-Helligkeit)
}

export interface MoodState {
	moods: Mood[];
	sequences: MoodSequence[];
	settings: Settings;
	addCustomMood: (mood: Omit<Mood, 'id'>) => void;
	removeMood: (id: string) => void;
	toggleFavorite: (id: string) => void;
	reorderMoods: (moods: Mood[]) => void;
	updateSettings: (settings: Partial<Settings>) => void;
	addSequence: (sequence: Omit<MoodSequence, 'id'>) => void;
	removeSequence: (id: string) => void;
	updateSequence: (id: string, sequence: Partial<MoodSequence>) => void;
}

const defaultMoods: Mood[] = [
	{
		id: '7',
		name: 'Feuer',
		colors: ['#8B0000', '#FF4500', '#FF8C00', '#FFD700'],
		animationType: 'pulse',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '21',
		name: 'Atem',
		colors: ['#e3f2fd', '#90caf9', '#42a5f5'],
		animationType: 'breath',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '19',
		name: 'Nordlicht',
		colors: ['#00FF87', '#00D9FF', '#60EFFF', '#7B68EE', '#9D50BB'],
		animationType: 'wave',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '15',
		name: 'Gewitter',
		colors: ['#2C3E50', '#34495E'],
		animationType: 'thunder',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '8',
		name: 'Licht',
		colors: ['#FFFFFF', '#F5F5F5', '#E8E8E8'],
		animationType: 'gradient',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '9',
		name: 'Blitzlicht',
		colors: ['#000000', '#FFFFFF'],
		animationType: 'flash',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '10',
		name: 'SOS',
		colors: ['#000000', '#FF0000'],
		animationType: 'sos',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '16',
		name: 'Meer',
		colors: ['#006994', '#1E90FF', '#4682B4', '#87CEEB'],
		animationType: 'wave',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '11',
		name: 'Kerze',
		colors: ['#FF4500', '#FF6347', '#FF8C00', '#FFA500'],
		animationType: 'candle',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '12',
		name: 'Polizei',
		colors: ['#0000FF', '#FF0000'],
		animationType: 'police',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '13',
		name: 'Warnsignal',
		colors: ['#FFA500', '#FFD700'],
		animationType: 'warning',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '14',
		name: 'Disco',
		colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0000', '#00FF00', '#0000FF'],
		animationType: 'disco',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '17',
		name: 'Sonnenaufgang',
		colors: [
			'#0f0c29',
			'#302b63', // Nacht
			'#1a1a2e',
			'#0f3460', // Früher Morgen
			'#434343',
			'#000000', // Dämmerung
			'#e94560',
			'#0f3460', // Rosa/Blau
			'#f39c12',
			'#f1c40f', // Gelb/Gold
			'#FDB99B',
			'#FCE38A', // Helles Gelb
		],
		animationType: 'sunrise',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '18',
		name: 'Sonnenuntergang',
		colors: [
			'#FDB99B',
			'#FCE38A', // Helles Gelb
			'#FF6B35',
			'#F7931E', // Orange
			'#e94560',
			'#f39c12', // Rot/Orange
			'#C1666B',
			'#8B5A8B', // Rosa/Lila
			'#4A235A',
			'#000428', // Dunkelviolett/Blau
			'#0f0c29',
			'#302b63', // Nacht
		],
		animationType: 'sunset',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '20',
		name: 'Wald',
		colors: ['#2d5016', '#3d7317', '#4a9d26', '#66bb6a', '#81c784'],
		animationType: 'gradient',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '22',
		name: 'Rave',
		colors: [
			'#FF00FF',
			'#00FFFF',
			'#FFFF00',
			'#FF0000',
			'#00FF00',
			'#0000FF',
			'#FF6600',
			'#FF0080',
		],
		animationType: 'rave',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '23',
		name: 'Scanner',
		colors: ['#000000', '#FF0000'],
		animationType: 'scanner',
		isFavorite: false,
		isCustom: false,
	},
	{
		id: '24',
		name: 'Matrix',
		colors: ['#000000', '#00FF00'],
		animationType: 'matrix',
		isFavorite: false,
		isCustom: false,
	},
];

const defaultSettings: Settings = {
	animationSpeed: 1,
	hapticFeedback: true,
	brightness: 1,
	autoTimer: 0,
	autoMoodSwitch: false,
	autoMoodSwitchInterval: 5,
	screenEnabled: true,
	flashlightEnabled: false,
	flashlightBrightness: 10, // Maximale Helligkeit als Standard
};

export const useStore = create<MoodState>()(
	persist(
		(set) => ({
			moods: defaultMoods,
			sequences: [],
			settings: defaultSettings,
			addCustomMood: (mood) =>
				set((state) => ({
					moods: [
						...state.moods,
						{ ...mood, id: Date.now().toString(), isCustom: true, isFavorite: false },
					],
				})),
			removeMood: (id) =>
				set((state) => ({
					moods: state.moods.filter((m) => m.id !== id),
				})),
			toggleFavorite: (id) =>
				set((state) => ({
					moods: state.moods.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m)),
				})),
			reorderMoods: (moods) => set({ moods }),
			updateSettings: (newSettings) =>
				set((state) => ({
					settings: { ...state.settings, ...newSettings },
				})),
			addSequence: (sequence) =>
				set((state) => ({
					sequences: [
						...state.sequences,
						{ ...sequence, id: Date.now().toString(), isCustom: true },
					],
				})),
			removeSequence: (id) =>
				set((state) => ({
					sequences: state.sequences.filter((s) => s.id !== id),
				})),
			updateSequence: (id, updates) =>
				set((state) => ({
					sequences: state.sequences.map((s) => (s.id === id ? { ...s, ...updates } : s)),
				})),
		}),
		{
			name: 'mood-light-storage-v16',
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);
