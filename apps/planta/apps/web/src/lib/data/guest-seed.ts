/**
 * Guest seed data for the Planta app.
 *
 * Provides a demo plant with watering schedule for the onboarding experience.
 */

import type { LocalPlant, LocalWateringSchedule } from './local-store';

const DEMO_PLANT_ID = 'demo-monstera';

export const guestPlants: LocalPlant[] = [
	{
		id: DEMO_PLANT_ID,
		name: 'Monstera',
		scientificName: 'Monstera deliciosa',
		commonName: 'Fensterblatt',
		lightRequirements: 'bright',
		wateringFrequencyDays: 7,
		humidity: 'medium',
		temperature: '18-24°C',
		careNotes: 'Mag indirektes Licht. Erde zwischen dem Gießen leicht antrocknen lassen.',
		isActive: true,
		healthStatus: 'healthy',
	},
	{
		id: 'demo-cactus',
		name: 'Kaktus',
		scientificName: 'Echinocactus grusonii',
		commonName: 'Schwiegermutterstuhl',
		lightRequirements: 'direct',
		wateringFrequencyDays: 21,
		humidity: 'low',
		temperature: '15-30°C',
		careNotes: 'Selten gießen, mag viel Sonne.',
		isActive: true,
		healthStatus: 'healthy',
	},
];

export const guestWateringSchedules: LocalWateringSchedule[] = [
	{
		id: 'schedule-monstera',
		plantId: DEMO_PLANT_ID,
		frequencyDays: 7,
		lastWateredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		nextWateringAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
		reminderEnabled: true,
		reminderHoursBefore: 24,
	},
	{
		id: 'schedule-cactus',
		plantId: 'demo-cactus',
		frequencyDays: 21,
		lastWateredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		nextWateringAt: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
		reminderEnabled: true,
		reminderHoursBefore: 24,
	},
];
