/**
 * Questions Store - Manages questions state using Svelte 5 runes
 */

import { questionsApi, type QuestionFilters } from '$lib/api/questions';
import type { Question, CreateQuestionDto, UpdateQuestionDto } from '$lib/types';

let questions = $state<Question[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let total = $state(0);
let currentFilters = $state<QuestionFilters>({});

export const questionsStore = {
	get questions() {
		return questions;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get total() {
		return total;
	},
	get filters() {
		return currentFilters;
	},

	async load(filters?: QuestionFilters) {
		loading = true;
		error = null;
		currentFilters = filters || {};

		try {
			const response = await questionsApi.getAll(filters);
			questions = response.data;
			total = response.total;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load questions';
			questions = [];
			total = 0;
		} finally {
			loading = false;
		}
	},

	async create(data: CreateQuestionDto): Promise<Question | null> {
		loading = true;
		error = null;

		try {
			const question = await questionsApi.create(data);
			questions = [question, ...questions];
			total++;
			return question;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create question';
			return null;
		} finally {
			loading = false;
		}
	},

	async update(id: string, data: UpdateQuestionDto): Promise<Question | null> {
		error = null;

		try {
			const updated = await questionsApi.update(id, data);
			questions = questions.map((q) => (q.id === id ? updated : q));
			return updated;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update question';
			return null;
		}
	},

	async delete(id: string): Promise<boolean> {
		error = null;

		try {
			await questionsApi.delete(id);
			questions = questions.filter((q) => q.id !== id);
			total--;
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete question';
			return false;
		}
	},

	async updateStatus(id: string, status: string): Promise<Question | null> {
		error = null;

		try {
			const updated = await questionsApi.updateStatus(id, status);
			questions = questions.map((q) => (q.id === id ? updated : q));
			return updated;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update status';
			return null;
		}
	},

	getById(id: string): Question | undefined {
		return questions.find((q) => q.id === id);
	},

	clear() {
		questions = [];
		total = 0;
		error = null;
		currentFilters = {};
	},
};
