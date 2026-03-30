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
