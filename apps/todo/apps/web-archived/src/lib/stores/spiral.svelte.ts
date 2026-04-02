/**
 * Spiral DB Store
 * Manages SpiralDB state for visual todo storage
 */

import {
	SpiralDB,
	createTodoSchema,
	type SpiralImage,
	type SpiralRecord,
	exportToPngBytes,
	importFromPngBytes,
	downloadPng,
} from '@manacore/spiral-db';

interface TodoData extends Record<string, unknown> {
	id: number;
	status: number;
	priority: number;
	createdAt: Date;
	dueDate: Date | null;
	completedAt: Date | null;
	title: string;
	description: string | null;
	tags: number[];
}

interface SpiralStats {
	imageSize: number;
	totalPixels: number;
	usedPixels: number;
	totalRecords: number;
	activeRecords: number;
	deletedRecords: number;
	currentRing: number;
	compressionRatio: number;
}

class SpiralStore {
	private db: SpiralDB<TodoData>;

	// Reactive state
	image = $state<SpiralImage | null>(null);
	stats = $state<SpiralStats | null>(null);
	records = $state<SpiralRecord<TodoData>[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);

	constructor() {
		this.db = new SpiralDB<TodoData>({
			schema: createTodoSchema(),
			compression: true,
		});
		this.updateState();
	}

	private updateState() {
		this.image = this.db.getImage();
		this.records = this.db.getAll();

		const dbStats = this.db.getStats();
		const jsonSize = JSON.stringify(this.records.map((r) => r.data)).length || 1;
		const pixelBytes = Math.ceil((dbStats.usedPixels * 3) / 8);

		this.stats = {
			...dbStats,
			compressionRatio: Math.round((1 - pixelBytes / jsonSize) * 100),
		};
	}

	/**
	 * Add a todo to the spiral database
	 */
	addTodo(todo: {
		title: string;
		description?: string;
		priority?: number;
		dueDate?: Date | null;
		tags?: number[];
	}) {
		const result = this.db.insert({
			id: 0, // Will be assigned by DB
			status: 0, // active
			priority: todo.priority ?? 1,
			createdAt: new Date(),
			dueDate: todo.dueDate ?? null,
			completedAt: null,
			title: todo.title,
			description: todo.description ?? null,
			tags: todo.tags ?? [],
		});

		if (result.success) {
			this.updateState();
		}

		return result;
	}

	/**
	 * Complete a todo
	 */
	completeTodo(id: number) {
		const result = this.db.complete(id);
		if (result.success) {
			this.updateState();
		}
		return result;
	}

	/**
	 * Delete a todo
	 */
	deleteTodo(id: number) {
		const result = this.db.delete(id);
		if (result.success) {
			this.updateState();
		}
		return result;
	}

	/**
	 * Get a specific todo by ID
	 */
	getTodo(id: number) {
		return this.db.read(id);
	}

	/**
	 * Import todos from the main task store
	 */
	importTodos(
		todos: Array<{
			title: string;
			description?: string | null;
			priority?: string;
			dueDate?: string | Date | null;
			isCompleted?: boolean;
			createdAt?: string | Date;
		}>
	) {
		// Reset database
		this.db = new SpiralDB<TodoData>({
			schema: createTodoSchema(),
			compression: true,
		});

		// Convert priority string to number
		const priorityMap: Record<string, number> = {
			low: 0,
			medium: 1,
			high: 2,
			urgent: 3,
		};

		for (const todo of todos) {
			const result = this.db.insert({
				id: 0,
				status: todo.isCompleted ? 1 : 0,
				priority: priorityMap[todo.priority || 'medium'] ?? 1,
				createdAt: todo.createdAt ? new Date(todo.createdAt) : new Date(),
				dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
				completedAt: todo.isCompleted ? new Date() : null,
				title: todo.title.slice(0, 50), // Max length from schema
				description: todo.description?.slice(0, 200) ?? null,
				tags: [],
			});

			if (result.success && todo.isCompleted) {
				this.db.complete(result.recordId!);
			}
		}

		this.updateState();
	}

	/**
	 * Export to PNG and download
	 */
	downloadPng(filename = 'spiral-todos.png') {
		if (this.image) {
			downloadPng(this.image, filename);
		}
	}

	/**
	 * Get PNG bytes for export
	 */
	getPngBytes(): Uint8Array | null {
		if (!this.image) return null;
		return exportToPngBytes(this.image);
	}

	/**
	 * Clear all data
	 */
	clear() {
		this.db = new SpiralDB<TodoData>({
			schema: createTodoSchema(),
			compression: true,
		});
		this.updateState();
	}

	/**
	 * Import from PNG file
	 */
	async importFromPng(file: File): Promise<{ success: boolean; error?: string }> {
		try {
			this.isLoading = true;
			this.error = null;

			// Read file as ArrayBuffer
			const buffer = await file.arrayBuffer();
			const bytes = new Uint8Array(buffer);

			// Parse PNG and extract image
			const image = await importFromPngBytes(bytes);

			// Reconstruct database from image
			this.db = SpiralDB.fromImage<TodoData>(image, createTodoSchema());
			this.updateState();

			return { success: true };
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			this.error = errorMessage;
			return { success: false, error: errorMessage };
		} finally {
			this.isLoading = false;
		}
	}
}

export const spiralStore = new SpiralStore();
