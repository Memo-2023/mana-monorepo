/**
 * Recipes module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalRecipe } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const recipeTable = db.table<LocalRecipe>('recipes');

// ─── Guest Seed ────────────────────────────────────────────

export const RECIPES_GUEST_SEED = {
	recipes: [
		{
			id: 'recipe-pfannkuchen',
			title: 'Pfannkuchen',
			description: 'Klassische deutsche Pfannkuchen — dünn und goldbraun.',
			ingredients: [
				{ name: 'Mehl', amount: '250', unit: 'g' },
				{ name: 'Milch', amount: '400', unit: 'ml' },
				{ name: 'Eier', amount: '3', unit: 'Stück' },
				{ name: 'Salz', amount: '1', unit: 'Prise' },
				{ name: 'Butter', amount: '2', unit: 'EL' },
			],
			steps: [
				'Mehl, Milch, Eier und Salz zu einem glatten Teig verrühren.',
				'Teig 15 Minuten ruhen lassen.',
				'Butter in einer Pfanne erhitzen und dünne Pfannkuchen ausbacken.',
				'Von beiden Seiten goldbraun braten.',
			],
			servings: 4,
			prepTimeMin: 10,
			cookTimeMin: 20,
			difficulty: 'easy',
			tags: ['Deutsch', 'Vegetarisch', 'Schnell'],
			isFavorite: true,
			photoMediaId: null,
			photoUrl: null,
			photoThumbnailUrl: null,
		},
		{
			id: 'recipe-aglio-olio',
			title: 'Spaghetti Aglio e Olio',
			description: 'Einfache italienische Pasta mit Knoblauch und Olivenöl.',
			ingredients: [
				{ name: 'Spaghetti', amount: '400', unit: 'g' },
				{ name: 'Knoblauch', amount: '6', unit: 'Stück' },
				{ name: 'Olivenöl', amount: '6', unit: 'EL' },
				{ name: 'Chiliflocken', amount: '1', unit: 'TL' },
				{ name: 'Petersilie', amount: '1', unit: 'Bund' },
				{ name: 'Salz', amount: '1', unit: 'TL' },
			],
			steps: [
				'Spaghetti in reichlich Salzwasser al dente kochen.',
				'Knoblauch in dünne Scheiben schneiden.',
				'Olivenöl in einer großen Pfanne erhitzen, Knoblauch und Chiliflocken bei niedriger Hitze goldbraun anbraten.',
				'Spaghetti abgießen (etwas Kochwasser aufheben) und in die Pfanne geben.',
				'Mit Kochwasser, Petersilie und Salz abschmecken.',
			],
			servings: 4,
			prepTimeMin: 5,
			cookTimeMin: 15,
			difficulty: 'easy',
			tags: ['Italienisch', 'Vegetarisch', 'Schnell'],
			isFavorite: false,
			photoMediaId: null,
			photoUrl: null,
			photoThumbnailUrl: null,
		},
		{
			id: 'recipe-gemuese-curry',
			title: 'Gemüse-Curry',
			description: 'Cremiges Curry mit saisonalem Gemüse und Kokosmilch.',
			ingredients: [
				{ name: 'Kichererbsen (Dose)', amount: '1', unit: 'Dose' },
				{ name: 'Kokosmilch', amount: '400', unit: 'ml' },
				{ name: 'Süßkartoffel', amount: '1', unit: 'Stück' },
				{ name: 'Spinat', amount: '200', unit: 'g' },
				{ name: 'Currypaste', amount: '2', unit: 'EL' },
				{ name: 'Zwiebel', amount: '1', unit: 'Stück' },
				{ name: 'Knoblauch', amount: '2', unit: 'Stück' },
				{ name: 'Ingwer', amount: '1', unit: 'EL' },
				{ name: 'Reis', amount: '300', unit: 'g' },
			],
			steps: [
				'Reis nach Packungsanleitung kochen.',
				'Zwiebel, Knoblauch und Ingwer fein hacken und in Öl anbraten.',
				'Currypaste hinzufügen und 1 Minute anrösten.',
				'Süßkartoffel würfeln, hinzugeben und mit Kokosmilch ablöschen.',
				'15 Minuten köcheln lassen, bis die Süßkartoffel weich ist.',
				'Kichererbsen und Spinat unterrühren, 3 Minuten ziehen lassen.',
				'Mit Salz abschmecken und mit Reis servieren.',
			],
			servings: 4,
			prepTimeMin: 15,
			cookTimeMin: 25,
			difficulty: 'medium',
			tags: ['Vegan', 'Asiatisch'],
			isFavorite: false,
			photoMediaId: null,
			photoUrl: null,
			photoThumbnailUrl: null,
		},
	] satisfies LocalRecipe[],
};
