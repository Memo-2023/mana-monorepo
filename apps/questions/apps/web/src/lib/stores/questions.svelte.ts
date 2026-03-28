/**
 * Questions Store — Mutation-Only
 *
 * All reads are handled by useLiveQuery (see $lib/data/queries.ts).
 * This store only exposes mutations that write to IndexedDB.
 * The live queries will automatically pick up the changes.
 */

import { questionCollection, type LocalQuestion } from '$lib/data/local-store';
import { toQuestion } from '$lib/data/queries';
import { QuestionsEvents } from '@manacore/shared-utils/analytics';
import type { Question, CreateQuestionDto, UpdateQuestionDto } from '$lib/types';

let loading = $state(false);
let error = $state<string | null>(null);

export const questionsStore = {
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Create a new question — writes to IndexedDB instantly.
	 */
	async create(data: CreateQuestionDto): Promise<Question | null> {
		loading = true;
		error = null;

		try {
			const newLocal: LocalQuestion = {
				id: crypto.randomUUID(),
				collectionId: data.collectionId ?? null,
				title: data.title,
				description: data.description ?? null,
				status: 'open',
				priority: data.priority || 'normal',
				tags: data.tags || [],
				researchDepth: data.researchDepth || 'standard',
			};

			const inserted = await questionCollection.insert(newLocal);
			QuestionsEvents.questionCreated(data.researchDepth || 'standard');
			return toQuestion(inserted);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create question';
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update a question — writes to IndexedDB instantly.
	 */
	async update(id: string, data: UpdateQuestionDto): Promise<Question | null> {
		error = null;

		try {
			const updateData: Partial<LocalQuestion> = {};
			if (data.title !== undefined) updateData.title = data.title;
			if (data.description !== undefined) updateData.description = data.description ?? null;
			if (data.collectionId !== undefined) updateData.collectionId = data.collectionId ?? null;
			if (data.tags !== undefined) updateData.tags = data.tags;
			if (data.priority !== undefined)
				updateData.priority = data.priority as LocalQuestion['priority'];
			if (data.researchDepth !== undefined)
				updateData.researchDepth = data.researchDepth as LocalQuestion['researchDepth'];

			const updated = await questionCollection.update(id, updateData);
			if (updated) return toQuestion(updated);
			return null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update question';
			return null;
		}
	},

	/**
	 * Delete a question — removes from IndexedDB instantly.
	 */
	async delete(id: string): Promise<boolean> {
		error = null;

		try {
			await questionCollection.delete(id);
			QuestionsEvents.questionDeleted();
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete question';
			return false;
		}
	},

	/**
	 * Update question status — writes to IndexedDB instantly.
	 */
	async updateStatus(id: string, status: string): Promise<Question | null> {
		error = null;

		try {
			const updated = await questionCollection.update(id, {
				status: status as LocalQuestion['status'],
			});
			if (updated) return toQuestion(updated);
			return null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update status';
			return null;
		}
	},

	/**
	 * No longer relevant — all questions are local and editable.
	 */
	isDemoQuestion(_id: string): boolean {
		return false;
	},

	clear() {
		error = null;
	},
};
