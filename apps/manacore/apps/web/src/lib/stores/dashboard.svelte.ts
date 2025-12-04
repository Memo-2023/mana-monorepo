/**
 * Dashboard Store - Manages dashboard configuration using Svelte 5 runes
 *
 * Handles widget layout, edit mode, and persistence to localStorage.
 */

import { browser } from '$app/environment';
import type { DashboardConfig, WidgetConfig, WidgetSize, WidgetType } from '$lib/types/dashboard';
import { DEFAULT_DASHBOARD_CONFIG, DASHBOARD_STORAGE_KEY } from '$lib/config/default-dashboard';
import { getWidgetMeta } from '$lib/types/dashboard';

// State
let config = $state<DashboardConfig>(structuredClone(DEFAULT_DASHBOARD_CONFIG));
let isEditing = $state(false);
let initialized = $state(false);

/**
 * Dashboard store with Svelte 5 runes
 */
export const dashboardStore = {
	// Getters
	get config() {
		return config;
	},
	get widgets() {
		return config.widgets.filter((w) => w.visible);
	},
	get allWidgets() {
		return config.widgets;
	},
	get isEditing() {
		return isEditing;
	},
	get initialized() {
		return initialized;
	},

	/**
	 * Initialize dashboard from localStorage
	 */
	initialize() {
		if (!browser || initialized) return;

		try {
			const stored = localStorage.getItem(DASHBOARD_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as DashboardConfig;
				// Validate structure
				if (parsed.widgets && Array.isArray(parsed.widgets)) {
					config = parsed;
				}
			}
		} catch (e) {
			console.error('Failed to load dashboard config:', e);
		}

		initialized = true;
	},

	/**
	 * Persist current config to localStorage
	 */
	persist() {
		if (!browser) return;

		try {
			config.lastModified = new Date().toISOString();
			localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(config));
		} catch (e) {
			console.error('Failed to save dashboard config:', e);
		}
	},

	/**
	 * Enter edit mode
	 */
	startEditing() {
		isEditing = true;
	},

	/**
	 * Exit edit mode and save changes
	 */
	stopEditing() {
		isEditing = false;
		this.persist();
	},

	/**
	 * Toggle edit mode
	 */
	toggleEditing() {
		if (isEditing) {
			this.stopEditing();
		} else {
			this.startEditing();
		}
	},

	/**
	 * Update widgets array (called during drag-and-drop)
	 */
	updateWidgets(widgets: WidgetConfig[]) {
		config.widgets = widgets;
	},

	/**
	 * Update a single widget's position
	 */
	updateWidgetPosition(widgetId: string, position: { x: number; y: number }) {
		const widget = config.widgets.find((w) => w.id === widgetId);
		if (widget) {
			widget.position = position;
		}
	},

	/**
	 * Update a widget's size
	 */
	updateWidgetSize(widgetId: string, size: WidgetSize) {
		const widget = config.widgets.find((w) => w.id === widgetId);
		if (widget) {
			widget.size = size;
			this.persist();
		}
	},

	/**
	 * Toggle widget visibility
	 */
	toggleWidgetVisibility(widgetId: string) {
		const widget = config.widgets.find((w) => w.id === widgetId);
		if (widget) {
			widget.visible = !widget.visible;
			this.persist();
		}
	},

	/**
	 * Add a new widget
	 */
	addWidget(type: WidgetType) {
		const meta = getWidgetMeta(type);
		if (!meta) return;

		// Check if multiple instances are allowed
		if (!meta.allowMultiple) {
			const existing = config.widgets.find((w) => w.type === type);
			if (existing) {
				// Just make it visible
				existing.visible = true;
				this.persist();
				return;
			}
		}

		// Generate unique ID
		const existingCount = config.widgets.filter((w) => w.type === type).length;
		const id = `${type}-${existingCount + 1}`;

		// Find the next available row
		const maxY = Math.max(...config.widgets.map((w) => w.position.y), -1);

		const newWidget: WidgetConfig = {
			id,
			type,
			title: meta.nameKey,
			size: meta.defaultSize,
			position: { x: 0, y: maxY + 1 },
			visible: true,
		};

		config.widgets = [...config.widgets, newWidget];
		this.persist();
	},

	/**
	 * Remove a widget
	 */
	removeWidget(widgetId: string) {
		config.widgets = config.widgets.filter((w) => w.id !== widgetId);
		this.persist();
	},

	/**
	 * Reset to default configuration
	 */
	resetToDefault() {
		config = structuredClone(DEFAULT_DASHBOARD_CONFIG);
		this.persist();
	},

	/**
	 * Check if a widget type is currently active (visible)
	 */
	isWidgetActive(type: WidgetType): boolean {
		return config.widgets.some((w) => w.type === type && w.visible);
	},

	/**
	 * Get available widgets that can be added
	 */
	getAvailableWidgets(): WidgetType[] {
		const activeTypes = new Set(config.widgets.filter((w) => w.visible).map((w) => w.type));
		return (
			[
				'credits',
				'quick-actions',
				'transactions',
				'tasks-today',
				'tasks-upcoming',
				'calendar-events',
				'chat-recent',
				'contacts-favorites',
				'zitare-quote',
			] as WidgetType[]
		).filter((type) => {
			const meta = getWidgetMeta(type);
			// Allow if multiple instances allowed or not currently active
			return meta?.allowMultiple || !activeTypes.has(type);
		});
	},
};
