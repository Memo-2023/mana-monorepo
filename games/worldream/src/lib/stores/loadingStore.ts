import { writable } from 'svelte/store';

export interface LoadingStep {
	id: string;
	label: string;
	status: 'pending' | 'active' | 'completed' | 'error';
	message?: string;
	duration?: number;
	startTime?: number;
}

interface LoadingState {
	isLoading: boolean;
	title: string;
	steps: LoadingStep[];
	currentStep: number;
	error?: string;
	funFact?: string;
	estimatedTime?: number;
	startTime?: number;
}

// Fun Facts für Worldbuilding
const worldbuildingFacts = [
	'💡 Wusstest du? Tolkien erfand Mittelerde ursprünglich für seine selbst erfundenen Sprachen.',
	'🌍 Die detailliertesten fiktiven Welten haben oft ihre eigene Zeitrechnung und Kalender.',
	'📚 George R.R. Martin schrieb 400.000 Wörter Hintergrundgeschichte, die nie veröffentlicht wurden.',
	'🗺️ Die Karte von Westeros basiert teilweise auf einem umgedrehten Irland.',
	'✨ Brandon Sanderson erstellt für jede seiner Welten eigene Magiesysteme mit festen Regeln.',
	'🎭 Gute Charaktere haben oft Widersprüche - das macht sie menschlich.',
	'🏰 Die besten Fantasy-Welten fühlen sich "gelebt" an, mit eigener Geschichte und Kultur.',
	'🌟 J.K. Rowling plante die Harry Potter Serie 5 Jahre lang, bevor sie zu schreiben begann.',
	'🐉 Drachen erscheinen in fast jeder Kultur der Welt - unabhängig voneinander.',
	"📖 Terry Pratchett's Scheibenwelt hat über 40 Romane und ist eine der detailliertesten Fantasywelten.",
	'🎨 Concept Art kann helfen, die Vision deiner Welt zu konkretisieren.',
	'🗣️ Erfundene Sprachen (Conlangs) geben deiner Welt zusätzliche Tiefe.',
	'⚔️ Die besten Konflikte entstehen aus den Motivationen der Charaktere, nicht aus dem Plot.',
	'🌙 Viele Autoren träumen von ihren Welten und Charakteren.',
	'🎬 Star Wars begann als 200-seitige Rohfassung, die niemand verstand.',
];

function getRandomFunFact(): string {
	return worldbuildingFacts[Math.floor(Math.random() * worldbuildingFacts.length)];
}

function createLoadingStore() {
	const { subscribe, set, update } = writable<LoadingState>({
		isLoading: false,
		title: '',
		steps: [],
		currentStep: -1,
	});

	let funFactInterval: NodeJS.Timeout | null = null;

	return {
		subscribe,

		// Start loading with steps
		start(title: string, steps: string[]) {
			const now = Date.now();
			set({
				isLoading: true,
				title,
				steps: steps.map((label, index) => ({
					id: `step-${index}`,
					label,
					status: 'pending',
					startTime: undefined,
				})),
				currentStep: 0,
				funFact: getRandomFunFact(),
				startTime: now,
				estimatedTime: now + steps.length * 7500, // Rough estimate: 7.5s per step for ~30s total
			});

			// Rotate fun facts every 5 seconds
			funFactInterval = setInterval(() => {
				update((state) => ({
					...state,
					funFact: getRandomFunFact(),
				}));
			}, 5000);

			// Activate first step
			this.nextStep();
		},

		// Move to next step
		nextStep(message?: string) {
			update((state) => {
				if (!state.isLoading) return state;

				const now = Date.now();

				// Complete current step
				if (state.currentStep >= 0 && state.currentStep < state.steps.length) {
					state.steps[state.currentStep].status = 'completed';
					if (message) {
						state.steps[state.currentStep].message = message;
					}
					// Calculate duration for completed step
					if (state.steps[state.currentStep].startTime) {
						state.steps[state.currentStep].duration =
							now - state.steps[state.currentStep].startTime;
					}
				}

				// Move to next step
				const nextIndex = state.currentStep + 1;
				if (nextIndex < state.steps.length) {
					state.steps[nextIndex].status = 'active';
					state.steps[nextIndex].startTime = now;
					state.currentStep = nextIndex;

					// Update estimated time based on completed steps
					const completedSteps = state.steps.filter((s) => s.status === 'completed').length;
					const remainingSteps = state.steps.length - completedSteps - 1; // -1 for current active step

					if (completedSteps > 0 && remainingSteps > 0) {
						const totalDuration = state.steps
							.filter((s) => s.duration)
							.reduce((sum, s) => sum + (s.duration || 0), 0);
						const avgDuration = totalDuration / completedSteps;
						// Estimated time is: now + (average duration * remaining steps)
						state.estimatedTime = now + avgDuration * remainingSteps;
					} else {
						// Default estimate: ~7.5 seconds per remaining step (for ~30s total with 4 steps)
						state.estimatedTime = now + remainingSteps * 7500;
					}
				}

				return state;
			});
		},

		// Update current step
		updateStep(message: string) {
			update((state) => {
				if (!state.isLoading) return state;
				if (state.currentStep >= 0 && state.currentStep < state.steps.length) {
					state.steps[state.currentStep].message = message;
				}
				return state;
			});
		},

		// Mark step as error
		setError(error: string) {
			update((state) => {
				if (!state.isLoading) return state;
				if (state.currentStep >= 0 && state.currentStep < state.steps.length) {
					state.steps[state.currentStep].status = 'error';
					state.steps[state.currentStep].message = error;
				}
				state.error = error;
				return state;
			});
		},

		// Complete loading
		complete(message?: string) {
			update((state) => {
				// Complete all remaining steps
				state.steps = state.steps.map((step) => ({
					...step,
					status: step.status === 'error' ? 'error' : 'completed',
				}));

				if (message && state.currentStep >= 0) {
					state.steps[state.currentStep].message = message;
				}

				return state;
			});

			// Clear fun fact interval
			if (funFactInterval) {
				clearInterval(funFactInterval);
				funFactInterval = null;
			}

			// Hide after a short delay
			setTimeout(() => {
				this.reset();
			}, 1500);
		},

		// Reset loading state
		reset() {
			// Clear fun fact interval
			if (funFactInterval) {
				clearInterval(funFactInterval);
				funFactInterval = null;
			}

			set({
				isLoading: false,
				title: '',
				steps: [],
				currentStep: -1,
			});
		},

		// Helper for AI generation steps
		startAiGeneration(kind: string) {
			const steps =
				kind === 'world'
					? [
							'🔍 Analysiere Anforderungen...',
							'🌍 Erstelle Grundlagen der Welt...',
							'📚 Generiere erweiterte Details...',
							'✨ Finalisiere Welt...',
						]
					: ['🔍 Analysiere Kontext...', '🎨 Generiere Inhalte...', '✨ Optimiere Ergebnis...'];

			this.start(`${kind.charAt(0).toUpperCase() + kind.slice(1)} wird erstellt`, steps);
		},

		// Helper for complete creation process with image
		startCompleteCreation(kind: string) {
			const kindLabel =
				{
					world: 'Welt',
					character: 'Charakter',
					place: 'Ort',
					object: 'Objekt',
					story: 'Story',
				}[kind] || kind;

			const steps = [
				'🤖 Generiere mit KI...',
				`💾 Erstelle ${kindLabel}...`,
				'🎨 Generiere Bild...',
				'✅ Fertigstellung...',
			];

			this.start(`${kindLabel} wird komplett erstellt`, steps);
		},
	};
}

export const loadingStore = createLoadingStore();
