import { describe, it, expect } from 'vitest';
import { DEFAULT_DASHBOARD_CONFIG, DASHBOARD_STORAGE_KEY } from './default-dashboard';
import { getWidgetMeta, type WidgetSize } from '$lib/types/dashboard';

describe('DEFAULT_DASHBOARD_CONFIG', () => {
	it('should have a 12-column grid', () => {
		expect(DEFAULT_DASHBOARD_CONFIG.gridColumns).toBe(12);
	});

	it('should have 3 default widgets', () => {
		expect(DEFAULT_DASHBOARD_CONFIG.widgets).toHaveLength(3);
	});

	it('should have all widgets visible by default', () => {
		for (const widget of DEFAULT_DASHBOARD_CONFIG.widgets) {
			expect(widget.visible).toBe(true);
		}
	});

	it('should include clock, tasks-today, and calendar widgets', () => {
		const types = DEFAULT_DASHBOARD_CONFIG.widgets.map((w) => w.type);
		expect(types).toContain('clock-timers');
		expect(types).toContain('tasks-today');
		expect(types).toContain('calendar-events');
	});

	it('should have unique widget IDs', () => {
		const ids = DEFAULT_DASHBOARD_CONFIG.widgets.map((w) => w.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length);
	});

	it('should have valid widget types that exist in registry', () => {
		for (const widget of DEFAULT_DASHBOARD_CONFIG.widgets) {
			const meta = getWidgetMeta(widget.type);
			expect(meta).toBeDefined();
		}
	});

	it('should have valid sizes', () => {
		const validSizes: WidgetSize[] = ['small', 'medium', 'large', 'full'];
		for (const widget of DEFAULT_DASHBOARD_CONFIG.widgets) {
			expect(validSizes).toContain(widget.size);
		}
	});

	it('should have valid grid positions', () => {
		for (const widget of DEFAULT_DASHBOARD_CONFIG.widgets) {
			expect(widget.position.x).toBeGreaterThanOrEqual(0);
			expect(widget.position.x).toBeLessThan(12);
			expect(widget.position.y).toBeGreaterThanOrEqual(0);
		}
	});

	it('should have i18n title keys', () => {
		for (const widget of DEFAULT_DASHBOARD_CONFIG.widgets) {
			expect(widget.title).toMatch(/^dashboard\.widgets\..+\.title$/);
		}
	});

	it('should have a lastModified timestamp', () => {
		expect(DEFAULT_DASHBOARD_CONFIG.lastModified).toBeTruthy();
	});
});

describe('DASHBOARD_STORAGE_KEY', () => {
	it('should be a non-empty string', () => {
		expect(DASHBOARD_STORAGE_KEY).toBeTruthy();
		expect(typeof DASHBOARD_STORAGE_KEY).toBe('string');
	});

	it('should contain manacore identifier', () => {
		expect(DASHBOARD_STORAGE_KEY).toContain('manacore');
	});
});
