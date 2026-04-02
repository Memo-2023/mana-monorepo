import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

const skilltreeOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei SkillTree!',
		description: 'Das kann SkillTree für dich tun:',
		emoji: '🌳',
		gradient: { from: 'emerald-500', to: 'emerald-700' },
		bullets: [
			'RPG-Skill-Baum für echte Fähigkeiten',
			'6 Bereiche: Intellekt, Körper, Kreativität, Sozial, Praktisch, Mindset',
			'XP sammeln & Level aufsteigen',
			'Aktivitäten loggen & Fortschritt tracken',
		],
	},
	{
		id: 'focusBranch',
		type: 'select',
		question: 'Welcher Bereich interessiert dich am meisten?',
		description: 'Du kannst alle Bereiche nutzen — das ist nur dein Startfokus.',
		emoji: '🎯',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		options: [
			{
				id: 'intellect',
				label: 'Intellekt',
				description: 'Wissen, Sprachen, Wissenschaft',
				emoji: '🧠',
			},
			{
				id: 'body',
				label: 'Körper',
				description: 'Fitness, Sport, Gesundheit',
				emoji: '💪',
			},
			{
				id: 'creativity',
				label: 'Kreativität',
				description: 'Kunst, Musik, Schreiben',
				emoji: '🎨',
			},
			{
				id: 'social',
				label: 'Sozial',
				description: 'Kommunikation, Führung',
				emoji: '👥',
			},
			{
				id: 'practical',
				label: 'Praktisch',
				description: 'Handwerk, Kochen, Technik',
				emoji: '🔧',
			},
			{
				id: 'mindset',
				label: 'Mindset',
				description: 'Meditation, Fokus, Resilienz',
				emoji: '🧘',
			},
		],
		defaultValue: 'intellect',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Dein Skill-Baum ist bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Erstelle Skills in deinem Fokus-Bereich',
			'Logge Aktivitäten, um XP zu sammeln',
			'Level reichen von Anfänger bis Meister',
			'Bleib dran — regelmäßige Aktivitäten geben Bonus-XP',
		],
	},
];

export const skilltreeOnboarding = createAppOnboardingStore({
	appId: 'skilltree',
	steps: skilltreeOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
