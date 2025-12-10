/**
 * Shared Types for Chart Components
 */

import type { Component } from 'svelte';

// Stat card variant colors
export type StatVariant = 'success' | 'primary' | 'neutral' | 'danger' | 'info' | 'accent';

export const STAT_VARIANT_COLORS: Record<StatVariant, { bg: string; color: string }> = {
	success: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
	primary: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' },
	neutral: { bg: 'rgba(107, 114, 128, 0.15)', color: '#6B7280' },
	danger: { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' },
	info: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
	accent: { bg: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' },
};

// StatsGrid types
export interface StatItem {
	id: string;
	label: string;
	value: number | string;
	icon: Component;
	variant: StatVariant;
	/** Optional: only show this stat if condition is true */
	showCondition?: boolean;
}

// ActivityHeatmap types
export interface HeatmapDataPoint {
	date: string; // YYYY-MM-DD format
	count: number;
	dayOfWeek: number; // 0-6 (Sunday-Saturday)
}

// TrendLineChart types
export interface TrendDataPoint {
	date: string; // YYYY-MM-DD format
	count: number;
	label?: string;
}

// DonutChart types
export interface DonutSegment {
	id: string;
	label: string;
	count: number;
	percentage: number;
	color: string;
}

// ProgressBars types
export interface ProgressItem {
	id: string;
	name: string;
	color: string;
	total: number;
	completed: number;
	inProgress?: number;
	percentage: number;
}
