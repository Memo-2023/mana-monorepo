/**
 * Questions Store - Manages questions state using Svelte 5 runes
 * Authenticated users: questions from API
 * Demo mode: static sample questions to showcase the app
 */

import { questionsApi, type QuestionFilters } from '$lib/api/questions';
import type { Question, CreateQuestionDto, UpdateQuestionDto } from '$lib/types';
import { authStore } from './auth.svelte';
import { generateDemoQuestions, isDemoQuestion } from '$lib/data/demo-questions';

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

	/**
	 * Load questions
	 * Demo mode: shows static sample questions
	 * Authenticated: fetches from API
	 */
	async load(filters?: QuestionFilters) {
		loading = true;
		error = null;
		currentFilters = filters || {};

		// Demo mode: load demo questions
		if (!authStore.isAuthenticated) {
			let demoQuestions = generateDemoQuestions();

			// Apply filters
			if (filters?.collectionId) {
				demoQuestions = demoQuestions.filter(
					(q: Question) => q.collectionId === filters.collectionId
				);
			}
			if (filters?.status) {
				demoQuestions = demoQuestions.filter((q: Question) => q.status === filters.status);
			}
			if (filters?.search) {
				const search = filters.search.toLowerCase();
				demoQuestions = demoQuestions.filter(
					(q: Question) =>
						q.title.toLowerCase().includes(search) ||
						q.description?.toLowerCase().includes(search) ||
						q.tags?.some((t: string) => t.toLowerCase().includes(search))
				);
			}

			questions = demoQuestions;
			total = demoQuestions.length;
			loading = false;
			return;
		}

		// Authenticated: fetch from API
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

	/**
	 * Create a new question
	 * Demo mode: returns auth_required error
	 * Authenticated: creates via API
	 */
	async create(data: CreateQuestionDto): Promise<Question | null> {
		// Demo mode: require authentication
		if (!authStore.isAuthenticated) {
			error = 'Login required to create questions';
			return null;
		}

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

	/**
	 * Update a question
	 * Demo mode: returns auth_required error
	 * Authenticated: updates via API
	 */
	async update(id: string, data: UpdateQuestionDto): Promise<Question | null> {
		// Demo question or not authenticated: require authentication
		if (isDemoQuestion(id) || !authStore.isAuthenticated) {
			error = 'Login required to update questions';
			return null;
		}

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

	/**
	 * Delete a question
	 * Demo mode: returns auth_required error
	 * Authenticated: deletes via API
	 */
	async delete(id: string): Promise<boolean> {
		// Demo question or not authenticated: require authentication
		if (isDemoQuestion(id) || !authStore.isAuthenticated) {
			error = 'Login required to delete questions';
			return false;
		}

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

	/**
	 * Update question status
	 * Demo mode: returns auth_required error
	 * Authenticated: updates via API
	 */
	async updateStatus(id: string, status: string): Promise<Question | null> {
		// Demo question or not authenticated: require authentication
		if (isDemoQuestion(id) || !authStore.isAuthenticated) {
			error = 'Login required to update question status';
			return null;
		}

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

	/**
	 * Check if a question is a demo question
	 */
	isDemoQuestion(id: string): boolean {
		return isDemoQuestion(id);
	},

	clear() {
		questions = [];
		total = 0;
		error = null;
		currentFilters = {};
	},
};
