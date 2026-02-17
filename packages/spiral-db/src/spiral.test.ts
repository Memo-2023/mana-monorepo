/**
 * SpiralDB Tests
 */

import { describe, it, expect } from 'vitest';
import {
	SpiralDB,
	createTodoSchema,
	spiralToXY,
	xyToSpiral,
	getRingInfo,
	getImageSizeForRing,
	visualizeImageEmoji,
	visualizeSpiralOrder,
} from './index.js';

describe('Spiral Coordinates', () => {
	it('should convert index 0 to center', () => {
		const point = spiralToXY(0, 5);
		expect(point).toEqual({ x: 2, y: 2 });
	});

	it('should handle first ring correctly', () => {
		// Ring 1 starts at index 1 and has 8 pixels
		const points = [];
		for (let i = 1; i <= 8; i++) {
			points.push(spiralToXY(i, 5));
		}
		// Should form a square around center
		expect(points).toHaveLength(8);
	});

	it('should round-trip coordinates', () => {
		const size = 11;
		for (let i = 0; i < 50; i++) {
			const point = spiralToXY(i, size);
			const index = xyToSpiral(point.x, point.y, size);
			expect(index).toBe(i);
		}
	});

	it('should calculate ring info correctly', () => {
		expect(getRingInfo(0)).toEqual({
			ring: 0,
			startIndex: 0,
			endIndex: 0,
			pixelCount: 1,
		});
		expect(getRingInfo(1)).toEqual({
			ring: 1,
			startIndex: 1,
			endIndex: 8,
			pixelCount: 8,
		});
		expect(getRingInfo(2)).toEqual({
			ring: 2,
			startIndex: 9,
			endIndex: 24,
			pixelCount: 16,
		});
	});

	it('should calculate image size for ring', () => {
		expect(getImageSizeForRing(0)).toBe(1);
		expect(getImageSizeForRing(1)).toBe(3);
		expect(getImageSizeForRing(2)).toBe(5);
		expect(getImageSizeForRing(5)).toBe(11);
	});
});

describe('SpiralDB', () => {
	it('should create database with schema', () => {
		const db = new SpiralDB({
			schema: createTodoSchema(),
		});

		const stats = db.getStats();
		expect(stats.totalRecords).toBe(0);
		expect(stats.imageSize).toBeGreaterThan(0);
	});

	it('should insert and read a record', () => {
		const db = new SpiralDB({
			schema: createTodoSchema(),
		});

		const todo = {
			id: 0,
			status: 0,
			priority: 1,
			createdAt: new Date('2025-01-01'),
			dueDate: new Date('2025-12-31'),
			completedAt: null,
			title: 'Test Todo',
			description: 'A test description',
			tags: [1, 2],
		};

		const insertResult = db.insert(todo);
		expect(insertResult.success).toBe(true);
		expect(insertResult.recordId).toBe(0);

		const readResult = db.read(0);
		expect(readResult.success).toBe(true);
		expect(readResult.record?.data.title).toBe('Test Todo');
		expect(readResult.record?.data.priority).toBe(1);
	});

	it('should handle multiple inserts', () => {
		const db = new SpiralDB({
			schema: createTodoSchema(),
		});

		for (let i = 0; i < 5; i++) {
			const result = db.insert({
				id: 0,
				status: 0,
				priority: i % 3,
				createdAt: new Date(),
				dueDate: null,
				completedAt: null,
				title: `Todo ${i}`,
				description: null,
				tags: [],
			});
			expect(result.success).toBe(true);
		}

		const stats = db.getStats();
		expect(stats.totalRecords).toBe(5);
		expect(stats.activeRecords).toBe(5);
	});

	it('should delete records', () => {
		const db = new SpiralDB({
			schema: createTodoSchema(),
		});

		db.insert({
			id: 0,
			status: 0,
			priority: 1,
			createdAt: new Date(),
			dueDate: null,
			completedAt: null,
			title: 'To Delete',
			description: null,
			tags: [],
		});

		const deleteResult = db.delete(0);
		expect(deleteResult.success).toBe(true);

		const readResult = db.read(0);
		expect(readResult.success).toBe(false);
		expect(readResult.error).toBe('Record has been deleted');
	});

	it('should mark records as completed', () => {
		const db = new SpiralDB({
			schema: createTodoSchema(),
		});

		db.insert({
			id: 0,
			status: 0,
			priority: 1,
			createdAt: new Date(),
			dueDate: null,
			completedAt: null,
			title: 'To Complete',
			description: null,
			tags: [],
		});

		const completeResult = db.complete(0);
		expect(completeResult.success).toBe(true);

		const readResult = db.read(0);
		expect(readResult.success).toBe(true);
		expect(readResult.record?.meta.status).toBe('completed');
	});

	it('should compact database', () => {
		const db = new SpiralDB({
			schema: createTodoSchema(),
		});

		// Insert several records
		for (let i = 0; i < 10; i++) {
			db.insert({
				id: 0,
				status: 0,
				priority: 1,
				createdAt: new Date(),
				dueDate: null,
				completedAt: null,
				title: `Todo ${i}`,
				description: null,
				tags: [],
			});
		}

		// Delete half
		for (let i = 0; i < 5; i++) {
			db.delete(i);
		}

		const statsBefore = db.getStats();
		expect(statsBefore.deletedRecords).toBe(5);

		// Compact
		db.compact();

		const statsAfter = db.getStats();
		expect(statsAfter.activeRecords).toBe(5);
		expect(statsAfter.deletedRecords).toBe(0);
	});

	it('should visualize database', () => {
		const db = new SpiralDB({
			schema: createTodoSchema(),
		});

		db.insert({
			id: 0,
			status: 0,
			priority: 1,
			createdAt: new Date(),
			dueDate: null,
			completedAt: null,
			title: 'Visual Test',
			description: null,
			tags: [],
		});

		const image = db.getImage();
		const emoji = visualizeImageEmoji(image);

		// Should contain valid emoji characters
		expect(emoji).toContain('⬜'); // Magic byte (white)
		expect(emoji.split('\n').length).toBe(image.height);
	});
});

describe('Visualization', () => {
	it('should visualize spiral order', () => {
		const visual = visualizeSpiralOrder(5);
		expect(visual).toContain('0'); // Center
		expect(visual.split('\n')).toHaveLength(5);
	});
});
