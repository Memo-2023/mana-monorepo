export type VisualizerType = 'bars' | 'butterchurn' | 'particles';

export interface VisualizerInfo {
	id: VisualizerType;
	name: string;
	description: string;
	icon: string;
}

export const VISUALIZERS: VisualizerInfo[] = [
	{
		id: 'bars',
		name: 'Frequency Bars',
		description: 'Classic equalizer bars with frequency spectrum',
		icon: '▊▊▊',
	},
	{
		id: 'butterchurn',
		name: 'Milkdrop',
		description: 'Classic Winamp/Milkdrop presets (500+ visuals)',
		icon: '✦',
	},
	{
		id: 'particles',
		name: 'Particles',
		description: 'GPU-accelerated particle flow reacting to audio',
		icon: '·:·',
	},
];

function createVisualizerStore() {
	let activeId = $state<VisualizerType>('bars');

	return {
		get active() {
			return activeId;
		},
		get activeInfo() {
			return VISUALIZERS.find((v) => v.id === activeId)!;
		},
		get all() {
			return VISUALIZERS;
		},

		setActive(id: VisualizerType) {
			activeId = id;
		},

		next() {
			const idx = VISUALIZERS.findIndex((v) => v.id === activeId);
			const nextIdx = (idx + 1) % VISUALIZERS.length;
			activeId = VISUALIZERS[nextIdx].id;
		},

		previous() {
			const idx = VISUALIZERS.findIndex((v) => v.id === activeId);
			const prevIdx = (idx - 1 + VISUALIZERS.length) % VISUALIZERS.length;
			activeId = VISUALIZERS[prevIdx].id;
		},
	};
}

export const visualizerStore = createVisualizerStore();
