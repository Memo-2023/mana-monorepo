/**
 * Clock Face store for Clock app
 * Manages the selected clock face style for the homepage
 * SSR-safe implementation with localStorage persistence
 */

import { browser } from '$app/environment';

// Storage key
const CLOCK_FACE_KEY = 'clock-selected-face';

// Available clock face types
export type ClockFaceType =
	// Analog faces
	| 'classic'
	| 'minimalist'
	| 'modern'
	| 'elegant'
	| 'sporty'
	| 'vintage'
	| 'nautical'
	| 'industrial'
	| 'bauhaus'
	| 'railway'
	// Digital faces
	| 'lcd'
	| 'flip'
	| 'matrix'
	| 'neon'
	| 'binary'
	| 'retro'
	| 'gradient'
	| 'terminal'
	| 'typewriter'
	| 'radar';

export interface ClockFaceDefinition {
	id: ClockFaceType;
	name: string;
	nameKey: string;
	description: string;
	descriptionKey: string;
	category: 'analog' | 'digital';
}

// All available clock faces
export const CLOCK_FACES: ClockFaceDefinition[] = [
	// Analog faces
	{
		id: 'classic',
		name: 'Classic',
		nameKey: 'clockFaces.classic.name',
		description: 'Elegant clock with Roman numerals',
		descriptionKey: 'clockFaces.classic.description',
		category: 'analog',
	},
	{
		id: 'minimalist',
		name: 'Minimalist',
		nameKey: 'clockFaces.minimalist.name',
		description: 'Clean design with only hour markers',
		descriptionKey: 'clockFaces.minimalist.description',
		category: 'analog',
	},
	{
		id: 'modern',
		name: 'Modern',
		nameKey: 'clockFaces.modern.name',
		description: 'Contemporary style with Arabic numerals',
		descriptionKey: 'clockFaces.modern.description',
		category: 'analog',
	},
	{
		id: 'elegant',
		name: 'Elegant',
		nameKey: 'clockFaces.elegant.name',
		description: 'Luxurious golden accents',
		descriptionKey: 'clockFaces.elegant.description',
		category: 'analog',
	},
	{
		id: 'sporty',
		name: 'Sporty',
		nameKey: 'clockFaces.sporty.name',
		description: 'Bold design inspired by sports watches',
		descriptionKey: 'clockFaces.sporty.description',
		category: 'analog',
	},
	{
		id: 'vintage',
		name: 'Vintage',
		nameKey: 'clockFaces.vintage.name',
		description: 'Antique clock with aged patina',
		descriptionKey: 'clockFaces.vintage.description',
		category: 'analog',
	},
	{
		id: 'nautical',
		name: 'Nautical',
		nameKey: 'clockFaces.nautical.name',
		description: 'Marine-inspired brass ship clock',
		descriptionKey: 'clockFaces.nautical.description',
		category: 'analog',
	},
	{
		id: 'industrial',
		name: 'Industrial',
		nameKey: 'clockFaces.industrial.name',
		description: 'Factory-style with metal accents',
		descriptionKey: 'clockFaces.industrial.description',
		category: 'analog',
	},
	{
		id: 'bauhaus',
		name: 'Bauhaus',
		nameKey: 'clockFaces.bauhaus.name',
		description: 'Geometric design with primary colors',
		descriptionKey: 'clockFaces.bauhaus.description',
		category: 'analog',
	},
	{
		id: 'railway',
		name: 'Railway',
		nameKey: 'clockFaces.railway.name',
		description: 'Swiss railway station clock style',
		descriptionKey: 'clockFaces.railway.description',
		category: 'analog',
	},
	// Digital faces
	{
		id: 'lcd',
		name: 'LCD',
		nameKey: 'clockFaces.lcd.name',
		description: 'Classic 7-segment LCD display',
		descriptionKey: 'clockFaces.lcd.description',
		category: 'digital',
	},
	{
		id: 'flip',
		name: 'Flip Clock',
		nameKey: 'clockFaces.flip.name',
		description: 'Retro split-flap display style',
		descriptionKey: 'clockFaces.flip.description',
		category: 'digital',
	},
	{
		id: 'matrix',
		name: 'Matrix',
		nameKey: 'clockFaces.matrix.name',
		description: 'Dot matrix LED display',
		descriptionKey: 'clockFaces.matrix.description',
		category: 'digital',
	},
	{
		id: 'neon',
		name: 'Neon',
		nameKey: 'clockFaces.neon.name',
		description: 'Glowing neon tube effect',
		descriptionKey: 'clockFaces.neon.description',
		category: 'digital',
	},
	{
		id: 'binary',
		name: 'Binary',
		nameKey: 'clockFaces.binary.name',
		description: 'Time displayed in binary format',
		descriptionKey: 'clockFaces.binary.description',
		category: 'digital',
	},
	{
		id: 'retro',
		name: 'Retro',
		nameKey: 'clockFaces.retro.name',
		description: 'Pixel-style CRT display',
		descriptionKey: 'clockFaces.retro.description',
		category: 'digital',
	},
	{
		id: 'gradient',
		name: 'Gradient',
		nameKey: 'clockFaces.gradient.name',
		description: 'Modern display with color shifts',
		descriptionKey: 'clockFaces.gradient.description',
		category: 'digital',
	},
	{
		id: 'terminal',
		name: 'Terminal',
		nameKey: 'clockFaces.terminal.name',
		description: 'Command-line interface style',
		descriptionKey: 'clockFaces.terminal.description',
		category: 'digital',
	},
	{
		id: 'typewriter',
		name: 'Typewriter',
		nameKey: 'clockFaces.typewriter.name',
		description: 'Vintage mechanical keyboard style',
		descriptionKey: 'clockFaces.typewriter.description',
		category: 'digital',
	},
	{
		id: 'radar',
		name: 'Radar',
		nameKey: 'clockFaces.radar.name',
		description: 'Military radar screen display',
		descriptionKey: 'clockFaces.radar.description',
		category: 'digital',
	},
];

// Default clock face
const DEFAULT_FACE: ClockFaceType = 'modern';

// State
let selectedFace = $state<ClockFaceType>(DEFAULT_FACE);
let initialized = $state(false);

export const clockFaceStore = {
	// Getters
	get selectedFace(): ClockFaceType {
		return selectedFace ?? DEFAULT_FACE;
	},
	get initialized(): boolean {
		return initialized;
	},
	get faces(): ClockFaceDefinition[] {
		return CLOCK_FACES;
	},
	get analogFaces(): ClockFaceDefinition[] {
		return CLOCK_FACES.filter((f) => f.category === 'analog');
	},
	get digitalFaces(): ClockFaceDefinition[] {
		return CLOCK_FACES.filter((f) => f.category === 'digital');
	},
	get currentFace(): ClockFaceDefinition | undefined {
		return CLOCK_FACES.find((f) => f.id === selectedFace);
	},

	/**
	 * Initialize from localStorage (client-side only)
	 */
	initialize() {
		if (!browser) return;
		if (initialized) return;

		const saved = localStorage.getItem(CLOCK_FACE_KEY) as ClockFaceType | null;
		if (saved && CLOCK_FACES.some((f) => f.id === saved)) {
			selectedFace = saved;
		}

		initialized = true;
	},

	/**
	 * Set the selected clock face
	 */
	setFace(face: ClockFaceType) {
		if (!CLOCK_FACES.some((f) => f.id === face)) return;

		selectedFace = face;
		if (browser) {
			localStorage.setItem(CLOCK_FACE_KEY, face);
		}
	},

	/**
	 * Check if a face is analog
	 */
	isAnalog(face: ClockFaceType): boolean {
		return CLOCK_FACES.find((f) => f.id === face)?.category === 'analog';
	},

	/**
	 * Check if a face is digital
	 */
	isDigital(face: ClockFaceType): boolean {
		return CLOCK_FACES.find((f) => f.id === face)?.category === 'digital';
	},
};
