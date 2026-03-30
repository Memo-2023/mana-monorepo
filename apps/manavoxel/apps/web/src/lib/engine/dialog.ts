/**
 * Dialog System — NPC interaction, text bubbles, merchant trading
 */

import type { GameItem } from './inventory.svelte';

// ─── Dialog Types ─────────────────────────────────────────────

export interface DialogLine {
	speaker: string;
	text: string;
	options?: DialogOption[];
}

export interface DialogOption {
	label: string;
	action: 'close' | 'trade' | 'next';
	nextIndex?: number;
}

export interface TradeOffer {
	item: GameItem;
	cost: number; // durability points from held item as "currency"
}

// ─── NPC Dialog Templates ─────────────────────────────────────

export function getDialogForBehavior(behavior: string, npcName?: string): DialogLine[] {
	const name = npcName ?? behavior;

	switch (behavior) {
		case 'merchant':
			return [
				{
					speaker: name,
					text: 'Welcome, traveler! Care to browse my wares?',
					options: [
						{ label: 'Show me what you have', action: 'trade' },
						{ label: 'Maybe later', action: 'close' },
					],
				},
			];

		case 'guard':
			return [
				{
					speaker: name,
					text: 'Stay out of trouble. This area is under my watch.',
					options: [{ label: 'Understood', action: 'close' }],
				},
			];

		case 'passive':
			return [
				{
					speaker: name,
					text: getRandomPassiveLine(),
					options: [{ label: 'Goodbye', action: 'close' }],
				},
			];

		default:
			return [
				{
					speaker: name,
					text: '...',
					options: [{ label: 'Leave', action: 'close' }],
				},
			];
	}
}

const passiveLines = [
	"Nice weather today, isn't it?",
	'Have you explored the dungeon yet?',
	'I heard there are treasures in the caves...',
	'Be careful at night. Things get dangerous.',
	'The merchant has some good items if you need supplies.',
	"I've been here for as long as I can remember.",
	'Watch out for the hostile creatures nearby.',
];

function getRandomPassiveLine(): string {
	return passiveLines[Math.floor(Math.random() * passiveLines.length)];
}

// ─── Dialog State Manager ─────────────────────────────────────

export class DialogManager {
	private _active = false;
	private _lines: DialogLine[] = [];
	private _currentIndex = 0;
	private _trading = false;
	private _npcBehavior = '';

	get active() {
		return this._active;
	}
	get currentLine(): DialogLine | null {
		if (!this._active || this._currentIndex >= this._lines.length) return null;
		return this._lines[this._currentIndex];
	}
	get isTrading() {
		return this._trading;
	}

	/** Start a dialog with an NPC */
	open(behavior: string, name?: string) {
		this._lines = getDialogForBehavior(behavior, name);
		this._currentIndex = 0;
		this._active = true;
		this._trading = false;
		this._npcBehavior = behavior;
	}

	/** Select a dialog option */
	selectOption(option: DialogOption): 'close' | 'trade' | 'continue' {
		switch (option.action) {
			case 'close':
				this.close();
				return 'close';
			case 'trade':
				this._trading = true;
				return 'trade';
			case 'next':
				if (option.nextIndex !== undefined) {
					this._currentIndex = option.nextIndex;
				} else {
					this._currentIndex++;
				}
				if (this._currentIndex >= this._lines.length) {
					this.close();
					return 'close';
				}
				return 'continue';
		}
	}

	close() {
		this._active = false;
		this._trading = false;
		this._currentIndex = 0;
	}
}

// ─── Merchant Trade Offers ────────────────────────────────────

export interface MerchantOffer {
	name: string;
	description: string;
	cost: number; // durability points from held item
	damage: number;
	range: number;
	speed: number;
	durabilityMax: number;
	element: string;
	rarity: string;
	particle: string;
}

export const MERCHANT_OFFERS: MerchantOffer[] = [
	{
		name: 'Stone Sword',
		description: 'A basic blade. Gets the job done.',
		cost: 20,
		damage: 25,
		range: 3,
		speed: 4,
		durabilityMax: 80,
		element: 'neutral',
		rarity: 'common',
		particle: 'sparks',
	},
	{
		name: 'Fire Wand',
		description: 'Shoots bursts of flame.',
		cost: 40,
		damage: 35,
		range: 6,
		speed: 2,
		durabilityMax: 50,
		element: 'fire',
		rarity: 'uncommon',
		particle: 'fire_burst',
	},
	{
		name: 'Ice Shard',
		description: 'Freezes on contact.',
		cost: 40,
		damage: 30,
		range: 5,
		speed: 3,
		durabilityMax: 60,
		element: 'ice',
		rarity: 'uncommon',
		particle: 'ice_shards',
	},
	{
		name: 'Healing Herb',
		description: 'Restores 30 HP when used.',
		cost: 15,
		damage: 0,
		range: 1,
		speed: 5,
		durabilityMax: 3,
		element: 'neutral',
		rarity: 'common',
		particle: 'heal_glow',
	},
	{
		name: 'Thunder Hammer',
		description: 'Devastating area damage.',
		cost: 60,
		damage: 60,
		range: 4,
		speed: 1,
		durabilityMax: 40,
		element: 'lightning',
		rarity: 'rare',
		particle: 'lightning_bolt',
	},
];

// ─── Loot Tables ──────────────────────────────────────────────

export interface LootDrop {
	name: string;
	chance: number; // 0-1
	damage: number;
	range: number;
	speed: number;
	durabilityMax: number;
	element: string;
	rarity: string;
	particle: string;
}

const HOSTILE_LOOT: LootDrop[] = [
	{
		name: 'Bone Club',
		chance: 0.4,
		damage: 15,
		range: 2,
		speed: 3,
		durabilityMax: 40,
		element: 'neutral',
		rarity: 'common',
		particle: 'sparks',
	},
	{
		name: 'Poison Fang',
		chance: 0.2,
		damage: 20,
		range: 2,
		speed: 5,
		durabilityMax: 30,
		element: 'poison',
		rarity: 'uncommon',
		particle: 'poison_cloud',
	},
	{
		name: 'Dark Crystal',
		chance: 0.1,
		damage: 40,
		range: 4,
		speed: 2,
		durabilityMax: 25,
		element: 'lightning',
		rarity: 'rare',
		particle: 'lightning_bolt',
	},
];

const GUARD_LOOT: LootDrop[] = [
	{
		name: 'Iron Shield',
		chance: 0.3,
		damage: 5,
		range: 1,
		speed: 2,
		durabilityMax: 150,
		element: 'neutral',
		rarity: 'uncommon',
		particle: 'sparks',
	},
	{
		name: 'Guard Sword',
		chance: 0.15,
		damage: 30,
		range: 3,
		speed: 3,
		durabilityMax: 100,
		element: 'neutral',
		rarity: 'rare',
		particle: 'sparks',
	},
];

/** Roll loot for a defeated NPC. Returns null if nothing drops. */
export function rollLoot(npcBehavior: string): LootDrop | null {
	const table = npcBehavior === 'guard' ? GUARD_LOOT : HOSTILE_LOOT;

	for (const drop of table) {
		if (Math.random() < drop.chance) return drop;
	}
	return null;
}
