/**
 * Guides Store — Mutation-Only Service
 *
 * CRUD for guides, sections, steps, and run tracking.
 * All user-typed text fields (title, description, content) are encrypted
 * before hitting Dexie.
 */

import { guideTable, sectionTable, stepTable, runTable } from '../collections';
import { toGuide, toSection, toStep, toRun } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import type {
	LocalGuide,
	LocalSection,
	LocalStep,
	LocalRun,
	Guide,
	Section,
	Step,
	Run,
	CreateGuideDto,
	UpdateGuideDto,
	CreateSectionDto,
	UpdateSectionDto,
	CreateStepDto,
	UpdateStepDto,
} from '../types';

export const guidesStore = {
	// ─── Guides ──────────────────────────────────────────

	async createGuide(dto: CreateGuideDto): Promise<Guide> {
		const existing = await guideTable.toArray();
		const order = existing.filter((g) => !g.deletedAt).length;

		const newLocal: LocalGuide = {
			id: crypto.randomUUID(),
			title: dto.title,
			description: dto.description ?? '',
			category: dto.category ?? 'getting-started',
			difficulty: dto.difficulty ?? 'beginner',
			estimatedMinutes: dto.estimatedMinutes ?? 5,
			collectionId: dto.collectionId ?? null,
			isPublished: false,
			order,
		};
		const snapshot = toGuide({ ...newLocal });
		await encryptRecord('guides', newLocal);
		await guideTable.add(newLocal);
		return snapshot;
	},

	async updateGuide(id: string, dto: UpdateGuideDto): Promise<void> {
		const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
		if (dto.title !== undefined) updates.title = dto.title;
		if (dto.description !== undefined) updates.description = dto.description;
		if (dto.category !== undefined) updates.category = dto.category;
		if (dto.difficulty !== undefined) updates.difficulty = dto.difficulty;
		if (dto.estimatedMinutes !== undefined) updates.estimatedMinutes = dto.estimatedMinutes;
		if (dto.collectionId !== undefined) updates.collectionId = dto.collectionId;
		if (dto.isPublished !== undefined) updates.isPublished = dto.isPublished;
		await encryptRecord('guides', updates);
		await guideTable.update(id, updates);
	},

	async deleteGuide(id: string): Promise<void> {
		const now = new Date().toISOString();
		// Cascade: soft-delete sections, steps, and runs
		const sections = await sectionTable.where('guideId').equals(id).toArray();
		for (const s of sections) {
			await sectionTable.update(s.id, { deletedAt: now, updatedAt: now });
		}
		const steps = await stepTable.where('guideId').equals(id).toArray();
		for (const s of steps) {
			await stepTable.update(s.id, { deletedAt: now, updatedAt: now });
		}
		const runs = await runTable.where('guideId').equals(id).toArray();
		for (const r of runs) {
			await runTable.update(r.id, { deletedAt: now, updatedAt: now });
		}
		await guideTable.update(id, { deletedAt: now, updatedAt: now });
	},

	// ─── Sections ────────────────────────────────────────

	async createSection(dto: CreateSectionDto): Promise<Section> {
		const existing = await sectionTable.where('guideId').equals(dto.guideId).toArray();
		const order = existing.filter((s) => !s.deletedAt).length;

		const newLocal: LocalSection = {
			id: crypto.randomUUID(),
			guideId: dto.guideId,
			title: dto.title,
			content: dto.content ?? null,
			order,
		};
		const snapshot = toSection({ ...newLocal });
		await encryptRecord('sections', newLocal);
		await sectionTable.add(newLocal);
		return snapshot;
	},

	async updateSection(id: string, dto: UpdateSectionDto): Promise<void> {
		const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
		if (dto.title !== undefined) updates.title = dto.title;
		if (dto.content !== undefined) updates.content = dto.content;
		await encryptRecord('sections', updates);
		await sectionTable.update(id, updates);
	},

	async deleteSection(id: string): Promise<void> {
		const now = new Date().toISOString();
		await sectionTable.update(id, { deletedAt: now, updatedAt: now });
	},

	// ─── Steps ───────────────────────────────────────────

	async createStep(dto: CreateStepDto): Promise<Step> {
		const existing = await stepTable.where('guideId').equals(dto.guideId).toArray();
		const order = existing.filter((s) => !s.deletedAt).length;

		const newLocal: LocalStep = {
			id: crypto.randomUUID(),
			guideId: dto.guideId,
			sectionId: dto.sectionId ?? null,
			title: dto.title,
			content: dto.content ?? null,
			order,
		};
		const snapshot = toStep({ ...newLocal });
		await encryptRecord('steps', newLocal);
		await stepTable.add(newLocal);
		return snapshot;
	},

	async updateStep(id: string, dto: UpdateStepDto): Promise<void> {
		const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
		if (dto.title !== undefined) updates.title = dto.title;
		if (dto.content !== undefined) updates.content = dto.content;
		if (dto.sectionId !== undefined) updates.sectionId = dto.sectionId;
		await encryptRecord('steps', updates);
		await stepTable.update(id, updates);
	},

	async deleteStep(id: string): Promise<void> {
		const now = new Date().toISOString();
		await stepTable.update(id, { deletedAt: now, updatedAt: now });
	},

	// ─── Runs (Progress Tracking) ────────────────────────

	async startRun(guideId: string): Promise<Run> {
		const newLocal: LocalRun = {
			id: crypto.randomUUID(),
			guideId,
			startedAt: new Date().toISOString(),
			completedAt: null,
			completedStepIds: [],
		};
		const snapshot = toRun({ ...newLocal });
		await runTable.add(newLocal);
		return snapshot;
	},

	async completeStep(runId: string, stepId: string): Promise<void> {
		const run = await runTable.get(runId);
		if (!run) return;
		if (run.completedStepIds.includes(stepId)) return;
		await runTable.update(runId, {
			completedStepIds: [...run.completedStepIds, stepId],
			updatedAt: new Date().toISOString(),
		});
	},

	async uncompleteStep(runId: string, stepId: string): Promise<void> {
		const run = await runTable.get(runId);
		if (!run) return;
		await runTable.update(runId, {
			completedStepIds: run.completedStepIds.filter((id) => id !== stepId),
			updatedAt: new Date().toISOString(),
		});
	},

	async completeRun(runId: string): Promise<void> {
		await runTable.update(runId, {
			completedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteRun(id: string): Promise<void> {
		const now = new Date().toISOString();
		await runTable.update(id, { deletedAt: now, updatedAt: now });
	},
};
