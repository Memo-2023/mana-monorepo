/**
 * Automations Store — Mutation-Only
 *
 * CRUD for automation rules. After each mutation, reloads triggers.
 */

import { automationTable } from '../collections';
import { loadAutomations } from '$lib/triggers';
import type { LocalAutomation } from '../types';
import type { ConditionOp } from '$lib/triggers/conditions';

export const automationsStore = {
	async create(data: {
		name: string;
		sourceApp: string;
		sourceCollection: string;
		sourceOp: 'insert' | 'update';
		conditionField?: string;
		conditionOp?: ConditionOp;
		conditionValue?: string;
		targetApp: string;
		targetAction: string;
		targetParams?: Record<string, string>;
	}) {
		const now = new Date().toISOString();
		const auto: LocalAutomation = {
			id: crypto.randomUUID(),
			name: data.name,
			enabled: true,
			sourceApp: data.sourceApp,
			sourceCollection: data.sourceCollection,
			sourceOp: data.sourceOp,
			conditionField: data.conditionField,
			conditionOp: data.conditionOp,
			conditionValue: data.conditionValue,
			targetApp: data.targetApp,
			targetAction: data.targetAction,
			targetParams: data.targetParams,
			createdAt: now,
			updatedAt: now,
		};
		await automationTable.add(auto);
		await loadAutomations();
		return auto;
	},

	async update(id: string, data: Partial<LocalAutomation>) {
		await automationTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
		await loadAutomations();
	},

	async toggle(id: string) {
		const auto = await automationTable.get(id);
		if (!auto) return;
		await automationTable.update(id, {
			enabled: !auto.enabled,
			updatedAt: new Date().toISOString(),
		});
		await loadAutomations();
	},

	async remove(id: string) {
		await automationTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		await loadAutomations();
	},
};
