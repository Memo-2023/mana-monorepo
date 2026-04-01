/**
 * Behavior Runtime — Event System + Trigger Evaluator + Action Executors
 *
 * Evaluates TriggerAction[] behaviors on items:
 *   Event fired → matching triggers found → conditions checked → actions executed
 */

import type { TriggerAction } from '@manavoxel/shared';
import type { GameItem } from './inventory.svelte';
import { playSound } from './audio';

// ─── Event Types ──────────────────────────────────────────────

export type GameEventType =
	| 'onUse'
	| 'onTouch'
	| 'onPickup'
	| 'onDrop'
	| 'onTimer'
	| 'onHpBelow'
	| 'onAreaEnter'
	| 'onCustomEvent'
	| 'onDayNight';

export interface GameEvent {
	type: GameEventType;
	item: GameItem;
	playerX: number;
	playerY: number;
	playerDirection: number;
	playerHp: number;
	params?: Record<string, unknown>;
}

// ─── Action Context (passed to executors) ─────────────────────

export interface ActionContext {
	// Player
	playerX: number;
	playerY: number;
	playerDirection: number;
	playerHp: number;
	setPlayerHp: (hp: number) => void;
	teleportPlayer: (x: number, y: number) => void;

	// World
	setPixel: (x: number, y: number, material: number) => void;
	getPixel: (x: number, y: number) => number;
	tileSize: number;

	// Effects
	spawnParticles: (type: string, x: number, y: number) => void;
	shakeCamera: (intensity: number, duration: number) => void;
	showMessage: (text: string) => void;

	// Item being used
	item: GameItem;
}

// ─── Event Bus ────────────────────────────────────────────────

type EventListener = (event: GameEvent) => void;

export class GameEventBus {
	private _listeners = new Map<GameEventType, EventListener[]>();
	private _timers = new Map<string, number>(); // itemId → accumulated frames
	private _variables = new Map<string, unknown>(); // global game variables

	on(type: GameEventType, listener: EventListener): () => void {
		const list = this._listeners.get(type) ?? [];
		list.push(listener);
		this._listeners.set(type, list);
		return () => {
			const idx = list.indexOf(listener);
			if (idx >= 0) list.splice(idx, 1);
		};
	}

	emit(event: GameEvent) {
		const listeners = this._listeners.get(event.type);
		if (!listeners) return;
		for (const listener of listeners) {
			listener(event);
		}
	}

	getVariable(name: string): unknown {
		return this._variables.get(name);
	}

	setVariable(name: string, value: unknown) {
		this._variables.set(name, value);
	}

	/** Track timer for an item, returns true when interval elapsed */
	tickTimer(itemId: string, intervalFrames: number): boolean {
		const current = (this._timers.get(itemId) ?? 0) + 1;
		if (current >= intervalFrames) {
			this._timers.set(itemId, 0);
			return true;
		}
		this._timers.set(itemId, current);
		return false;
	}

	clearTimers() {
		this._timers.clear();
	}

	destroy() {
		this._listeners.clear();
		this._timers.clear();
		this._variables.clear();
	}
}

// ─── Behavior Runtime ─────────────────────────────────────────

export class BehaviorRuntime {
	private _eventBus: GameEventBus;
	private _cleanup: (() => void)[] = [];

	constructor(eventBus: GameEventBus) {
		this._eventBus = eventBus;
	}

	/** Register an item's behaviors so they respond to events */
	registerItem(item: GameItem, behaviors: TriggerAction[], getContext: () => ActionContext) {
		for (const behavior of behaviors) {
			const triggerType = behavior.trigger.type as GameEventType;

			const unsub = this._eventBus.on(triggerType, (event) => {
				// Only respond to events for this item
				if (event.item.id !== item.id) return;

				// Trigger-specific parameter checks
				if (triggerType === 'onHpBelow') {
					const threshold = Number(behavior.trigger.params.threshold ?? 50);
					if (event.playerHp >= threshold) return;
				}
				if (triggerType === 'onCustomEvent') {
					const expected = String(behavior.trigger.params.eventName ?? '');
					const received = String(event.params?.eventName ?? '');
					if (expected && expected !== received) return;
				}

				// Check conditions
				if (behavior.conditions && !this._checkConditions(behavior.conditions, event)) return;

				// Execute actions sequentially
				const ctx = getContext();
				this._executeActions(behavior.actions, ctx);
			});

			this._cleanup.push(unsub);
		}
	}

	/** Unregister all behaviors */
	destroy() {
		for (const unsub of this._cleanup) unsub();
		this._cleanup = [];
	}

	/** Check if HP dropped below any registered thresholds and fire onHpBelow */
	private _checkHpBelow(newHp: number, ctx: ActionContext) {
		this._eventBus.emit({
			type: 'onHpBelow',
			item: ctx.item,
			playerX: ctx.playerX,
			playerY: ctx.playerY,
			playerDirection: ctx.playerDirection,
			playerHp: newHp,
			params: { currentHp: newHp },
		});
	}

	private _checkConditions(
		conditions: { type: string; params: Record<string, unknown> }[],
		event: GameEvent
	): boolean {
		for (const condition of conditions) {
			switch (condition.type) {
				case 'hpAbove':
					if (event.playerHp <= Number(condition.params.threshold ?? 0)) return false;
					break;
				case 'hpBelow':
					if (event.playerHp >= Number(condition.params.threshold ?? 100)) return false;
					break;
				case 'hasVariable':
					if (!this._eventBus.getVariable(String(condition.params.name ?? ''))) return false;
					break;
				case 'variableEquals': {
					const val = this._eventBus.getVariable(String(condition.params.name ?? ''));
					if (val !== condition.params.value) return false;
					break;
				}
			}
		}
		return true;
	}

	private _executeActions(
		actions: { type: string; params: Record<string, unknown> }[],
		ctx: ActionContext
	) {
		for (const action of actions) {
			this._executeAction(action, ctx);
		}
	}

	private _executeAction(
		action: { type: string; params: Record<string, unknown> },
		ctx: ActionContext
	) {
		const effectDistance = 10 + ctx.item.properties.range * 3;
		const dirOffsets = [
			{ dx: 0, dy: -1 }, // up
			{ dx: 1, dy: 0 }, // right
			{ dx: 0, dy: 1 }, // down
			{ dx: -1, dy: 0 }, // left
		];
		const dir = dirOffsets[ctx.playerDirection] ?? dirOffsets[2];
		const facingX = ctx.playerX + dir.dx * effectDistance;
		const facingY = ctx.playerY + dir.dy * effectDistance;

		switch (action.type) {
			case 'damage': {
				const amount = Number(action.params.amount ?? 10);
				const newHp = Math.max(0, ctx.playerHp - amount);
				ctx.setPlayerHp(newHp);
				// Fire onHpBelow for all items that have threshold triggers
				this._checkHpBelow(newHp, ctx);
				break;
			}

			case 'heal': {
				const amount = Number(action.params.amount ?? 10);
				ctx.setPlayerHp(Math.min(100, ctx.playerHp + amount));
				break;
			}

			case 'particle': {
				const type = String(action.params.type ?? 'sparks');
				ctx.spawnParticles(type, facingX, facingY);
				break;
			}

			case 'sound': {
				const name = String(action.params.name ?? 'hit_default');
				playSound(name);
				break;
			}

			case 'setPixel': {
				const material = Number(action.params.material ?? 1);
				const radius = Number(action.params.radius ?? 1);
				const tileX = Math.floor(facingX / ctx.tileSize);
				const tileY = Math.floor(facingY / ctx.tileSize);
				for (let dy = -radius; dy <= radius; dy++) {
					for (let dx = -radius; dx <= radius; dx++) {
						if (Math.abs(dx) + Math.abs(dy) <= radius) {
							ctx.setPixel(tileX + dx, tileY + dy, material);
						}
					}
				}
				break;
			}

			case 'deletePixel': {
				const radius = Number(action.params.radius ?? 2);
				const tileX = Math.floor(facingX / ctx.tileSize);
				const tileY = Math.floor(facingY / ctx.tileSize);
				for (let dy = -radius; dy <= radius; dy++) {
					for (let dx = -radius; dx <= radius; dx++) {
						if (Math.abs(dx) + Math.abs(dy) <= radius) {
							ctx.setPixel(tileX + dx, tileY + dy, 0); // MATERIAL_AIR
						}
					}
				}
				break;
			}

			case 'teleport': {
				const x = Number(action.params.x ?? 0);
				const y = Number(action.params.y ?? 0);
				ctx.teleportPlayer(x, y);
				break;
			}

			case 'message': {
				const text = String(action.params.text ?? '');
				if (text) ctx.showMessage(text);
				break;
			}

			case 'setVariable': {
				const name = String(action.params.name ?? '');
				if (name) this._eventBus.setVariable(name, action.params.value);
				break;
			}

			case 'sendEvent': {
				const eventName = String(action.params.eventName ?? '');
				if (eventName) {
					this._eventBus.emit({
						type: 'onCustomEvent',
						item: ctx.item,
						playerX: ctx.playerX,
						playerY: ctx.playerY,
						playerDirection: ctx.playerDirection,
						playerHp: ctx.playerHp,
						params: { eventName },
					});
				}
				break;
			}

			case 'cameraShake': {
				const intensity = Number(action.params.intensity ?? 3);
				ctx.shakeCamera(intensity, 15); // 15 frames ≈ 0.25s
				break;
			}
		}
	}
}
